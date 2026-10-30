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
    public class CollectionController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<CollectionController> logger) : ControllerBase
    {
        private const int MaxNameLength = 255;
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>Request body for creating a collection.</summary>
        /// <param name="CollectionName">The collection name (1-255 characters).</param>
        /// <param name="Public">Whether other users can see the collection. Defaults to private.</param>
        public record CollectionCreateDto(
            [Required, StringLength(MaxNameLength, MinimumLength = 1)] string CollectionName,
            bool Public = false);

        /// <summary>Request body for changing a collection's visibility.</summary>
        /// <param name="Public">Whether the collection is visible to other users.</param>
        /// <param name="IncludePrompts">Also apply the visibility to the current user's prompts in the collection.</param>
        public record CollectionVisibilityDto(bool Public, bool IncludePrompts = false);

        /// <summary>Request body for updating a collection.</summary>
        /// <param name="Name">The new collection name (1-255 characters).</param>
        /// <param name="Public">Whether other users can see the collection. Defaults to private.</param>
        public record UpdateCollectionDto(
            [Required, StringLength(MaxNameLength, MinimumLength = 1)] string Name,
            bool Public = false);

        private async Task<bool> OwnsCollection(MySqlConnection connection, int collectionId, CancellationToken ct)
        {
            var command = new CommandDefinition(
                sqlQueryStore.Get("GetCollectionOwnership"),
                new { collectionId, userId = CurrentUserId },
                cancellationToken: ct);
            return await connection.ExecuteScalarAsync<int>(command) > 0;
        }

        private async Task<bool> CanViewCollection(MySqlConnection connection, int collectionId, CancellationToken ct)
        {
            var command = new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId, userId = CurrentUserId },
                cancellationToken: ct);
            return await connection.QuerySingleOrDefaultAsync<Collection>(command) != null;
        }

        /// <summary>Create a collection</summary>
        /// <remarks>Creates a new collection owned by the current user. Set <c>public</c> to make it visible to other users.</remarks>
        /// <response code="201">Collection created.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="500">Database failed to create the collection.</response>
        [HttpPost("create")]
        [Consumes("application/json")]
        [ProducesResponseType<Collection>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<Collection>> Create([FromBody] CollectionCreateDto creationDto, CancellationToken cancellationToken)
        {
            logger.LogDebug("Create action called in CollectionController with name: {collectionName}", creationDto.CollectionName);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

            var collectionId = await connection.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
                sqlQueryStore.Get("PostInsertCollection"),
                new { name = creationDto.CollectionName, @public = creationDto.Public, userId = CurrentUserId },
                transaction,
                cancellationToken: cancellationToken));

            if (collectionId == null)
            {
                logger.LogError("Database returned no result when creating collection with name: {collectionName}", creationDto.CollectionName);
                return Problem(
                        title: "Database Error",
                        detail: "The insert statement executed, but no ID was returned.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            else if (collectionId <= 0)
            {
                logger.LogWarning("Failed to create a new collection with name: {collectionName}", creationDto);
                return Problem(
                        title: "Creation Failed",
                        detail: $"The database failed to generate a valid ID for the new collection.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Successfully created a new collection with name: {collectionName}", creationDto);

            var collection = await connection.QuerySingleAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId, userId = CurrentUserId },
                cancellationToken: cancellationToken));

            return CreatedAtAction(nameof(GetCollectionById), new { collectionId }, collection);
        }

        /// <summary>Get a collection</summary>
        /// <remarks>Returns a collection owned by the current user, or a public collection.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <response code="200">The collection.</response>
        /// <response code="404">Collection not found.</response>
        [HttpGet("{collectionId:int:min(1)}")]
        [ProducesResponseType<Collection>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Collection>> GetCollectionById([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetCollectionById method called in CollectionController for collection {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetCollectionById");
            var command = new CommandDefinition(sql, new { collectionId, userId = CurrentUserId }, cancellationToken: cancellationToken);
            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            if (collection == null)
            {
                logger.LogWarning("No collection found with ID {collectionId}", collectionId);
                return Problem(
                        title: "ID not found",
                        detail: $"Collection with ID {collectionId} not found.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            logger.LogInformation("Successfully retrieved collection with ID {collectionId}", collectionId);
            return Ok(collection);
        }

        /// <summary>List Collection</summary>
        /// <remarks>Returns collections owned by the current user, or public collections.</remarks>
        /// <param name="scope">all (default), owned, or others (public collections of other users).</param>
        /// <response code="200">The list of collections.</response>
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<Collection>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyList<Collection>>> GetAllCollections([FromQuery] ListScope scope, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetAllCollections method called in CollectionController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sql, new { userId = CurrentUserId, scope = scope.ToString().ToLowerInvariant() }, cancellationToken: cancellationToken);
            var allCollections = (await connection.QueryAsync<Collection>(command)).AsList();
            logger.LogInformation("Retrieved {count} collections", allCollections.Count);
            return Ok(allCollections);
        }

        /// <summary>Update a collection</summary>
        /// <remarks>Renames a collection owned by the current user and sets its visibility. Omitting <c>public</c> makes the collection private.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <param name="dto">The new collection name and visibility.</param>
        /// <response code="200">The updated collection.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="404">Collection not found.</response>
        [HttpPut("{collectionId:int:min(1)}")]
        [Consumes("application/json")]
        [ProducesResponseType<Collection>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Collection>> Edit([FromRoute] int collectionId, [FromBody] UpdateCollectionDto dto, CancellationToken cancellationToken)
        {
            logger.LogDebug("Edit action called for collection: {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("PostUpdateCollectionById");
            var command = new CommandDefinition(sql, new { collectionId, name = dto.Name, @public = dto.Public, userId = CurrentUserId }, cancellationToken: cancellationToken);
            var updatedCollection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            if (updatedCollection == null)
            {
                logger.LogWarning("Failed to edit collection with ID: {collectionId}", collectionId);
                return Problem(
                        title: "Database Error",
                        detail: $"Collection with ID {collectionId} was not found or could not be updated.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            logger.LogInformation("Successfully edited collection with ID: {collectionId}", collectionId);
            return Ok(updatedCollection);
        }

        /// <summary>Set collection visibility</summary>
        /// <remarks>Publishes or unpublishes a collection owned by the current user, optionally applying the same visibility to the current user's prompts within it.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <param name="dto">The desired visibility.</param>
        /// <response code="200">The updated collection.</response>
        /// <response code="404">Collection not found.</response>
        [HttpPut("{collectionId:int:min(1)}/visibility")]
        [Consumes("application/json")]
        [ProducesResponseType<Collection>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Collection>> SetVisibility([FromRoute] int collectionId, [FromBody] CollectionVisibilityDto dto, CancellationToken cancellationToken)
        {
            logger.LogDebug("SetVisibility action called for collection: {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            var parameters = new { collectionId, @public = dto.Public, userId = CurrentUserId };

            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("SetCollectionVisibility"), parameters, transaction, cancellationToken: cancellationToken));

            if (collection == null)
            {
                logger.LogWarning("Failed to set visibility of collection with ID: {collectionId}", collectionId);
                return Problem(
                    title: "Collection not found",
                    detail: $"Failed to find any collection with ID {collectionId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }

            if (dto.IncludePrompts)
            {
                await connection.ExecuteAsync(new CommandDefinition(
                    sqlQueryStore.Get("SetPromptsVisibilityInCollection"), parameters, transaction, cancellationToken: cancellationToken));
            }

            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Set collection {collectionId} visibility to public={public} (includePrompts: {includePrompts})", collectionId, dto.Public, dto.IncludePrompts);
            return Ok(collection);
        }

        /// <summary>Delete a collection</summary>
        /// <remarks>Deletes a specific collection owned by the current user.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <response code="204">Collection deleted.</response>
        /// <response code="404">Collection not found.</response>
        [HttpDelete("{collectionId:int:min(1)}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteCollection([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("DeleteCollection action called for collection: {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("DeleteCollectionById");
            var command = new CommandDefinition(sql, new { collectionId, userId = CurrentUserId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                logger.LogWarning("Failed to delete collection with ID: {collectionId}", collectionId);
                return Problem(
                    title: "Collection not found",
                    detail: $"Failed to find any collection with ID {collectionId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Successfully deleted collection with ID: {collectionId}", collectionId);
            return NoContent();
        }

        /// <summary>Link a prompt</summary>
        /// <remarks>Adds a prompt to a collection and returns the ID of the new link.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <param name="promptId">The prompt ID.</param>
        /// <response code="200">The ID of the new link.</response>
        /// <response code="404">Collection or prompt not found.</response>
        /// <response code="409">Prompt is already in the collection.</response>
        /// <response code="500">Database failed to create the link.</response>
        [HttpPost("{collectionId:int:min(1)}/prompts/{promptId:int:min(1)}")]
        [ProducesResponseType<int>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<int>> LinkPromptToCollection([FromRoute] int collectionId, [FromRoute] int promptId, CancellationToken cancellationToken) 
        {
            logger.LogDebug("Attempt to link a prompt to a collection Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            if (!await OwnsCollection(connection, collectionId, cancellationToken))
            {
                return Problem(
                    title: "Collection not found",
                    detail: $"Collection with ID {collectionId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            var sql = sqlQueryStore.Get("PostInsertConnection");

            var command = new CommandDefinition(sql, new { promptId, collectionId, userId = CurrentUserId }, cancellationToken: cancellationToken);
            int? entryId;
            try
            {
                entryId = await connection.QuerySingleOrDefaultAsync<int?>(command);
            }
            catch (MySqlException ex) when (ex.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
            {
                return Problem(title: "Already linked",
                    detail: $"Prompt {promptId} is already in collection {collectionId}.",
                    statusCode: StatusCodes.Status409Conflict);
            }
            if (entryId == null)
            {
                return Problem(title: "Prompt not found",
                    detail: $"Prompt with ID {promptId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            else if (entryId <= 0)
            {
                logger.LogWarning("Failed to create a new connection from Prompt {promptId} to Collection {collectionId}", promptId, collectionId);
                return Problem(
                        title: "Creation of connection Failed",
                        detail: "The database failed to generate a connection from the prompt to the collection.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }

            logger.LogInformation("Successfully created a new connection with entryId: {entryId}", entryId);
            return Ok(entryId);
        }

        /// <summary>Unlink a prompt</summary>
        /// <remarks>Removes a prompt from a collection.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <param name="promptId">The prompt ID.</param>
        /// <response code="204">Prompt unlinked.</response>
        /// <response code="404">Collection or link not found.</response>
        [HttpDelete("{collectionId:int:min(1)}/prompts/{promptId:int:min(1)}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UnlinkPromptFromCollection([FromRoute] int collectionId, [FromRoute] int promptId, CancellationToken cancellationToken)
        {
            logger.LogDebug("UnlinkConnection action called for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            if (!await OwnsCollection(connection, collectionId, cancellationToken))
            {
                return Problem(
                    title: "Collection not found",
                    detail: $"Collection with ID {collectionId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            var sql = sqlQueryStore.Get("DeletePromptCollectionConnection");
            var command = new CommandDefinition(sql, new { promptId, collectionId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                logger.LogWarning("Failed to delete connection for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
                return Problem(
                    title: "Connection not found",
                    detail: $"Failed to find any connection with collectionId {collectionId} and promptId {promptId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            logger.LogInformation("Successfully deleted connection for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            return NoContent();
        }

        /// <summary>List prompts in a collection</summary>
        /// <remarks>Returns the prompts in a collection owned by the current user, or in a public collection.</remarks>
        /// <param name="collectionId">The collection ID.</param>
        /// <response code="200">The prompts in the collection.</response>
        /// <response code="404">Collection not found.</response>
        [HttpGet("all/{collectionId:int:min(1)}")]
        [ProducesResponseType<IReadOnlyList<Prompt>>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyList<Prompt>>> GetAllFromCollection([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetAllPrompts in specific collection action called in CollectionController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            if (!await CanViewCollection(connection, collectionId, cancellationToken))
            {
                return Problem(
                    title: "Collection not found",
                    detail: $"Collection with ID {collectionId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            var sql = sqlQueryStore.Get("GetAllFromCollection");
            var command = new CommandDefinition(sql, new { collectionId, userId = CurrentUserId }, cancellationToken: cancellationToken);
            var allPrompts = await connection.QueryAsync<Prompt>(command);
            logger.LogInformation("Successfully retrieved all Prompts");
            return Ok(allPrompts);
        }

    }
}
