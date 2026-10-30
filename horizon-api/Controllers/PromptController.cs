using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace horizon_api.Controllers
{
    [ApiController]
    [Authorize]
    [ApiExplorerSettings(GroupName = "public")]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public class PromptController(
        SqlQueryStore sqlQueryStore, 
        MySqlDataSource dataSource, 
        ILogger<PromptController> logger) : ControllerBase
    {
        private const int MaxTextLength = 255;

        /// <summary>Request body for creating a prompt.</summary>
        /// <param name="PromptText">The prompt text (1-255 characters).</param>
        /// <param name="Type">The prompt category (1-255 characters).</param>
        /// <param name="CollectionId">Optional collection to add the prompt to. Must be owned by the current user.</param>
        /// <param name="Public">Whether other users can see and use the prompt. Defaults to private.</param>
        public record CreatePromptDto(
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string PromptText,
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string Type,
            long? CollectionId = null,
            bool Public = false);

        /// <summary>Response body after creating a prompt.</summary>
        /// <param name="Prompt">The created prompt.</param>
        /// <param name="CollectionId">The collection the prompt was added to, if any.</param>
        public record CreatePromptResponse(Prompt Prompt, long? CollectionId);

        /// <summary>Request body for changing a prompt's visibility.</summary>
        /// <param name="Public">Whether the prompt is visible to other users.</param>
        public record VisibilityDto(bool Public);

        /// <summary>Request body for replacing a prompt.</summary>
        /// <param name="PromptText">The new prompt text (1-255 characters).</param>
        /// <param name="Type">The new prompt category (1-255 characters).</param>
        /// <param name="Public">Whether other users can see and use the prompt. Defaults to private.</param>
        public record UpdatePromptDto(
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string PromptText,
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string Type,
            bool Public = false);

        /// <summary>Create a prompt</summary>
        /// <remarks>Creates a new prompt owned by the current user. If a collection ID is provided, 
        /// the prompt is also added to that collection. Set <c>public</c> to make it visible to other users.</remarks>
        /// <response code="201">Prompt created.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="404">Collection not found.</response>
        /// <response code="500">Database failed to create the prompt.</response>
        [HttpPost]
        [Consumes("application/json")]
        [ProducesResponseType<CreatePromptResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CreatePromptResponse>> PostCreate(
            [FromBody] CreatePromptDto promptDto, 
            CancellationToken cancellationToken)
        {
            logger.LogDebug("Create action called in PromptController with: {@PromptDto}", promptDto);

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            if (promptDto.CollectionId is { } collectionId)
            {
                var owns = await connection.ExecuteScalarAsync<long>(new CommandDefinition(
                    sqlQueryStore.Get("GetCollectionOwnership"),
                    new { collectionId, userId },
                    cancellationToken: cancellationToken)) > 0;

                if (!owns)
                {
                    return Problem(
                        title: "Collection not found",
                        detail: $"Collection with ID {collectionId} not found.",
                        statusCode: StatusCodes.Status404NotFound);
                }
            }

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("PostInsert");
            var command = new CommandDefinition(
                sql,
                new { promptDto.PromptText, promptDto.Type, promptDto.CollectionId, promptDto.Public, UserId = userId },
                transaction,
                cancellationToken: cancellationToken);

            var createdPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);
            if (createdPrompt == null)
            {
                // The transaction rolls back on dispose.
                logger.LogError("Database returned no result when creating prompt with text: {PromptText}", promptDto.PromptText);
                return Problem(
                    title: "Database Error",
                    detail: "The insert statement executed, but no prompt record was returned.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            await transaction.CommitAsync(cancellationToken);
            var response = new CreatePromptResponse(createdPrompt, promptDto.CollectionId);

            logger.LogInformation("Successfully created a new prompt with ID {PromptId}", createdPrompt.PromptId);
            return CreatedAtAction(nameof(GetPrompt), new { promptId = createdPrompt.PromptId }, response);
        }

        /// <summary>Get a prompt</summary>
        /// <remarks>Returns a prompt owned by the current user, or a public prompt.</remarks>
        /// <param name="promptId">The prompt ID.</param>
        /// <response code="200">The prompt.</response>
        /// <response code="404">Prompt not found.</response>
        [HttpGet("{promptId:long:min(1)}")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Prompt>> GetPrompt([FromRoute, Required] long promptId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetPrompt called for prompt {PromptId}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetById"); 
            var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var command = new CommandDefinition(sql, new { promptId, userId }, cancellationToken: cancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                logger.LogWarning("No accessible prompt found with ID {PromptId}", promptId);
                return Problem(
                        title: "ID not found",
                        detail: $"Prompt with ID {promptId} not found.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            logger.LogInformation("Retrieved prompt {PromptId}", promptId);
            return Ok(prompt);
        }

        /// <summary>List prompts</summary>
        /// <remarks>Returns a page of the prompts available to the current user, ordered by ID. Each prompt
        /// <param name="page">Page number, starting at 1.</param>
        /// <param name="pageSize">Number of prompts per page (1-100).</param>
        /// <param name="scope">all (default), owned, or others (public prompts of other users).</param>
        /// <param name="includeCollectionIds">Also return the IDs of the collections each prompt belongs to.</param>
        /// <param name="userId">Only return prompts created by this user ID.</param>
        /// <param name="search">Partial match (contains) on the prompt text.</param>
        /// <response code="200">The page of prompts.</response>
        /// <response code="400">Invalid paging values.</response>
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<Prompt>>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IReadOnlyList<Prompt>>> GetAllPrompts(
            [FromQuery, Range(1, int.MaxValue)] int page = 1, 
            [FromQuery, Range(1, 100)] int pageSize = 50, 
            [FromQuery] ListScope scope = ListScope.All, 
            [FromQuery] bool includeCollectionIds = false, 
            [FromQuery] long? userId = null,
            [FromQuery, StringLength(100)] string? search = null,
            CancellationToken cancellationToken = default)
        {
            logger.LogDebug("GetAllPrompts called (Page: {Page}, PageSize: {PageSize})", page, pageSize);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetAll");
            var currentUserId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var command = new CommandDefinition(sql, new { 
                pageSize, 
                offset = (long)(page - 1) * pageSize, 
                userId = currentUserId, 
                authorId = userId,
                search = string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
                scope = scope.ToString().ToLowerInvariant() 
            }, cancellationToken: cancellationToken);
            var allPrompts = (await connection.QueryAsync<Prompt>(command)).AsList();

            if (includeCollectionIds && allPrompts.Count > 0)
            {
                var links = await connection.QueryAsync<(long PromptId, long CollectionId)>(new CommandDefinition(
                    sqlQueryStore.Get("GetCollectionIdsForPrompts"),
                    new { promptIds = allPrompts.Select(p => p.PromptId).ToArray(), userId = currentUserId },
                    cancellationToken: cancellationToken));
                var byPrompt = links.ToLookup(l => l.PromptId, l => l.CollectionId);
                foreach (var prompt in allPrompts)
                {
                    prompt.CollectionIds = byPrompt[prompt.PromptId].ToList();
                }
            }

            logger.LogInformation("Retrieved {Count} prompts", allPrompts.Count);
            return Ok(allPrompts);
        }

        /// <summary>Get a random prompt</summary>
        /// <remarks>Returns a random prompt available to the current user, optionally picked from a specific collection.</remarks>
        /// <param name="collectionId">Only pick from this collection.</param>
        /// <response code="200">A random prompt.</response>
        /// <response code="404">No prompts available.</response>
        [HttpGet("random")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Prompt>> GetRandomPrompt([FromQuery] long? collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetRandomPrompt called (CollectionId: {CollectionId})", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("GetRandomPrompt");
            var command = new CommandDefinition(sql, new { 
                collectionId, 
                userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
            }, cancellationToken: cancellationToken);

            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                logger.LogWarning("No prompts available for random selection (CollectionId: {CollectionId})", collectionId);
                return Problem(
                    title: "Not Found",
                    detail: "No prompts found to pick randomly from.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }

            logger.LogInformation("Retrieved random prompt {PromptId}", prompt.PromptId);
            return Ok(prompt);
        }

        /// <summary>Update a prompt</summary>
        /// <remarks>Replaces the text, type and visibility of a prompt owned by the current user. 
        /// Omitting <c>public</c> makes the prompt private.</remarks>
        /// <param name="promptId">The prompt ID.</param>
        /// <param name="promptDto">The new prompt text, type and visibility.</param>
        /// <response code="200">The updated prompt.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="404">Prompt not found.</response>
        [HttpPut("{promptId:long:min(1)}")]
        [Consumes("application/json")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PostEdit(
            [FromRoute] long promptId, 
            [FromBody] UpdatePromptDto promptDto, 
            CancellationToken cancellationToken)
        {
            logger.LogDebug("Edit called for prompt {PromptId}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("PostUpdateById");
            var command = new CommandDefinition(sql, new { 
                promptId, 
                promptDto.PromptText, 
                promptDto.Type, 
                promptDto.Public, 
                userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
            }, cancellationToken: cancellationToken);
            var updatedPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (updatedPrompt == null)
            {
                logger.LogWarning("Prompt {PromptId} not found or not owned by the user; update skipped", promptId);
                return Problem(
                    title: "Prompt not found",
                    detail: $"Prompt with ID {promptId} not found.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Edited prompt {PromptId}", promptId);
            return Ok(updatedPrompt);
        }

        /// <summary>Set prompt visibility</summary>
        /// <remarks>Publishes or unpublishes a prompt owned by the current user.</remarks>
        /// <param name="promptId">The prompt ID.</param>
        /// <param name="dto">The desired visibility.</param>
        /// <response code="200">The updated prompt.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="404">Prompt not found.</response>
        [HttpPut("{promptId:long:min(1)}/visibility")]
        [Consumes("application/json")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SetVisibility(
            [FromRoute] long promptId, 
            [FromBody] VisibilityDto dto, 
            CancellationToken cancellationToken)
        {
            logger.LogDebug("SetVisibility called for prompt {PromptId} (public: {Public})", promptId, dto.Public);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var command = new CommandDefinition(sqlQueryStore.Get("SetVisibility"), new { 
                promptId, 
                @public = dto.Public, 
                userId 
            }, cancellationToken: cancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                logger.LogWarning("Prompt {PromptId} not found or not owned by the user; visibility unchanged", promptId);
                return Problem(
                    title: "Prompt not found",
                    detail: $"Prompt with ID {promptId} not found.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Set prompt {PromptId} visibility to public={Public}", promptId, dto.Public);
            return Ok(prompt);
        }

        /// <summary>Delete a prompt</summary>
        /// <remarks>Deletes a prompt owned by the current user.</remarks>
        /// <param name="promptId">The prompt ID.</param>
        /// <response code="204">Prompt deleted.</response>
        /// <response code="404">Prompt not found.</response>
        [HttpDelete("{promptId:long:min(1)}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] long promptId, CancellationToken cancellationToken)
        {
            logger.LogDebug("Delete called for prompt {PromptId}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("DeleteById");
            var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var command = new CommandDefinition(sql, new { promptId, userId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);
            if (rowsAffected == 0)
            {
                logger.LogWarning("Prompt {PromptId} not found or not owned by the user; delete skipped", promptId);
                return Problem(
                    title: "Prompt not found",
                    detail: $"Prompt with ID {promptId} not found.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Deleted prompt {PromptId}", promptId);
            return NoContent();
        }
    }
}
