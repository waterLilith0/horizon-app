using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace horizon_api.Controllers
{
    [ApiController]
    [Authorize]
    [ApiExplorerSettings(GroupName = "public")]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public class PromptController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<PromptController> logger) : Controller
    {
        private const int MaxTextLength = 255;

        public record CreatePromptDto(
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string PromptText,
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string Type,
            int? CollectionId = null);

        public record CreatePromptResponse(Prompt Prompt, int? CollectionId);

        public record UpdatePromptDto(
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string PromptText,
            [Required, StringLength(MaxTextLength, MinimumLength = 1)] string Type);


        // Check if the allPrompts controller is running
        [AllowAnonymous]
        [HttpGet("checkstatus")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCheck()
        {
            logger.LogDebug("Successfully got to the PromptController.");
            return Ok("PromptController is running.");
        }

        // Create a new prompt; optionally insert it into a collection immediately
        [HttpPost]
        [Consumes("application/json")]
        [ProducesResponseType<CreatePromptResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CreatePromptResponse>> PostCreate([FromBody] CreatePromptDto promptDto, CancellationToken cancellationToken)
        {
            logger.LogDebug("Create action called in PromptController with: {@PromptDto}", promptDto);

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("PostInsert");

            var command = new CommandDefinition(sql, new { promptDto.PromptText, promptDto.Type, promptDto.CollectionId }, cancellationToken: cancellationToken);

            var createdPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);
            if (createdPrompt == null)
            {
                logger.LogError("Database returned no result when creating prompt with text: {PromptText}", promptDto.PromptText);
                return Problem(
                    title: "Database Error",
                    detail: "The insert statement executed, but no prompt record was returned.",
                    statusCode: StatusCodes.Status500InternalServerError
                );
            }
            var response = new CreatePromptResponse(createdPrompt, promptDto.CollectionId);

            logger.LogInformation("Successfully created a new prompt with ID {PromptId}", createdPrompt.PromptId);
            return CreatedAtAction(nameof(GetPrompt), new { promptId = createdPrompt.PromptId }, response);
        }

        // Get a specific allPrompts
        [HttpGet("{promptId:int:min(1)}")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Prompt>> GetPrompt([FromRoute, Required] int promptId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetPromptById method called in PromptController for allPrompts {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetById");
            var command = new CommandDefinition(sql, new { promptId }, cancellationToken: cancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                logger.LogWarning("No allPrompts found with ID {prompt}", promptId);
                return Problem(
                        title: "ID not found",
                        detail: $"Prompt with ID {promptId} not found.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            logger.LogInformation("Successfully retrieved allPrompts with ID {prompt}", promptId);
            return Ok(prompt);
        }

        // Get all prompts, optionally filtered by amount
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<Prompt>>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IReadOnlyList<Prompt>>> GetAllPrompts([FromQuery, Range(1, 1000)] int? resultAmount, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetAllPrompts action called in PromptController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetAll");
            var command = new CommandDefinition(sql, new { resultAmount },cancellationToken: cancellationToken);
            var allPrompts = (await connection.QueryAsync<Prompt>(command)).AsList();

            logger.LogInformation("Successfully retrieved all Prompts");
            return Ok(allPrompts);
        }

        // Get a random rowsAffected; optionally from a specific collection
        [HttpGet("random")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Prompt>> GetRandomPrompt([FromQuery] int? collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetRandomPrompt action called in PromptController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("GetRandomPrompt");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);

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

            logger.LogInformation("Successfully retrieved random rowsAffected with ID {PromptId}", prompt.PromptId);
            return Ok(prompt);
        }

        // Update/edit old prompt
        [HttpPut("{promptId:int:min(1)}")]
        [Consumes("application/json")]
        [ProducesResponseType<Prompt>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PostEdit([FromRoute] int promptId, [FromBody] UpdatePromptDto promptDto, CancellationToken cancellationToken)
        {
            logger.LogDebug("Edit action called for Prompt {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("PostUpdateById");
            var command = new CommandDefinition(sql, new { promptId, promptDto.PromptText, promptDto.Type }, cancellationToken: cancellationToken);
            var updatedPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (updatedPrompt == null)
            {
                logger.LogWarning("Couldn't find old rowsAffected with id {oldId} to update", promptId);
                return Problem(
                    title: "Not Found",
                    detail: $"Couldn't find rowsAffected with id {promptId}",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Succesfully edited item with id {prompt}", promptId);
            return Ok(updatedPrompt);
        }

        // Deletes a specific prompt
        [HttpDelete("{promptId:int:min(1)}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] int promptId, CancellationToken cancellationToken)
        {
            logger.LogDebug("Delete action called for Prompt {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = sqlQueryStore.Get("DeleteById");
            var command = new CommandDefinition(sql, new { promptId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                logger.LogWarning("Failed to delete prompt with ID: {prompt}", promptId);
                return Problem(
                    title: "Prompt not found",
                    detail: $"Failed to find any prompt with ID {promptId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Succesfully deleted prompt with id {prompt}", promptId);
            return NoContent();
        }
    }
}
