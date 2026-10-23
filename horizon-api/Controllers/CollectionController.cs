using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace horizon_api.Controllers
{
    [ApiController]
    [Authorize]
    [ApiExplorerSettings(GroupName = "public")]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public class CollectionController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<CollectionController> logger) : Controller
    {
        private const int MaxNameLength = 255;
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public record CollectionCreateDto(
            [property: Required, StringLength(MaxNameLength, MinimumLength = 1)] string CollectionName);

        public record UpdateCollectionDto(
            [property: Required, StringLength(MaxNameLength, MinimumLength = 1)] string Name);

        private async Task<bool> OwnsCollection(MySqlConnection connection, int collectionId, CancellationToken ct)
        {
            var command = new CommandDefinition(
                sqlQueryStore.Get("GetCollectionOwnership"),
                new { collectionId, userId = CurrentUserId },
                cancellationToken: ct);
            return await connection.ExecuteScalarAsync<int>(command) > 0;
        }

        [AllowAnonymous]
        [HttpGet("checkstatus")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public IActionResult GetCheck()
        {
            logger.LogInformation("Successfully got to the CollectionController.");
            return Ok("CollectionController is running.");
        }

        // Create a single collection
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
                new { name = creationDto.CollectionName },
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
            await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("PostInsertCollectionToUser"),
                new { collectionId, userId = CurrentUserId },
                transaction,
                cancellationToken: cancellationToken));

            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Successfully created a new collection with name: {collectionName}", creationDto);

            var collection = await connection.QuerySingleAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId, userId = CurrentUserId },
                cancellationToken: cancellationToken));

            return CreatedAtAction(nameof(GetCollectionById), new { collectionId }, collection);
        }

        // Get a single collection
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

        // Get all collections as an array
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<Collection>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyList<Collection>>> GetAllCollections(CancellationToken cancellationToken)
        {
            logger.LogDebug("GetAllCollections method called in CollectionController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sql, new { userId = CurrentUserId }, cancellationToken: cancellationToken);
            var allCollections = (await connection.QueryAsync<Collection>(command)).AsList();
            logger.LogInformation("Retrieved {count} collections", allCollections.Count);
            return Ok(allCollections);
        }

        // Update call for a specific collection
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
            var command = new CommandDefinition(sql, new { collectionId, name = dto.Name, userId = CurrentUserId }, cancellationToken: cancellationToken);
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

        // DeleteCollection a specific collection
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

        // Link a prompt to a collection
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

            var command = new CommandDefinition(sql, new { promptId, collectionId }, cancellationToken: cancellationToken);
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
            catch (MySqlException ex) when (ex.ErrorCode == MySqlErrorCode.NoReferencedRow2)
            {
                return Problem(title: "Prompt not found",
                    detail: $"Prompt with ID {promptId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            if (entryId == null)
            {
                logger.LogError("Database returned no result when trying to connect Prompt {promptId} to Collection {collectionId}", promptId, collectionId);
                return Problem(
                        title: "Database Error",
                        detail: "The insert statement executed, but no ID was returned.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
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

        // Unlink a prompt from a collection
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

        // Get all prompts in a specific collection
        [HttpGet("all/{collectionId:int:min(1)}")]
        [ProducesResponseType<IReadOnlyList<Prompt>>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyList<Prompt>>> GetAllFromCollection([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            logger.LogDebug("GetAllPrompts in specific collection action called in CollectionController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            if (!await OwnsCollection(connection, collectionId, cancellationToken))
            {
                return Problem(
                    title: "Collection not found",
                    detail: $"Collection with ID {collectionId} not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }
            var sql = sqlQueryStore.Get("GetAllFromCollection");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);
            var allPrompts = await connection.QueryAsync<Prompt>(command);

            logger.LogInformation("Successfully retrieved all Prompts");
            return Ok(allPrompts);
        }

    }
}
