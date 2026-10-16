using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.Net;

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CollectionController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<CollectionController> logger) : Controller
    {
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;
        private readonly ILogger<CollectionController> _logger = logger;

        // GET: CollectionController/checkstatus
        [HttpGet("checkstatus")]
        public async Task<ActionResult<HttpStatusCode>> GetCheck()
        {
            _logger.LogInformation("Successfully got to the CollectionController.");
            return Ok("CollectionController is running.");
        }

        public record CollectionCreateDto(string CollectionName);
        // Create a single collection
        [HttpPost("create")]
        public async Task<ActionResult<Collection>> Create([FromBody] CollectionCreateDto creationDto, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Create action called in CollectionController with name: {collectionName}", creationDto.CollectionName);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("PostInsertCollection");

            var command = new CommandDefinition(sql, new { name = creationDto.CollectionName }, cancellationToken: cancellationToken);
            var collectionId = await connection.QuerySingleOrDefaultAsync<int?>(command);
            if (collectionId == null)
            {
                _logger.LogError("Database returned no result when creating collection with name: {collectionName}", creationDto.CollectionName);
                return Problem(
                        title: "Database Error",
                        detail: "The insert statement executed, but no ID was returned.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            else if (collectionId <= 0)
            {
                _logger.LogWarning("Failed to create a new collection with name: {collectionName}", creationDto);
                return Problem(
                        title: "Creation Failed",
                        detail: $"The database failed to generate a valid ID for the new collection.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            _logger.LogInformation("Successfully created a new collection with name: {collectionName}", creationDto);
            return CreatedAtAction(nameof(GetCollectionById), new { collectionId }, creationDto.CollectionName);
        }

        // Get a single collection
        [HttpGet("{collectionId:int}")]
        public async Task<ActionResult<Collection>> GetCollectionById([FromRoute]int collectionId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetCollectionById method called in CollectionController for collection {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetCollectionById");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);
            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            if (collection == null)
            {
                _logger.LogWarning("No collection found with ID {collectionId}", collectionId);
                return Problem(
                        title: "ID not found",
                        detail: $"Collection with ID {collectionId} not found.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            _logger.LogInformation("Successfully retrieved collection with ID {collectionId}", collectionId);
            return Ok(collection);
        }

        // Get all collections as an array
        [HttpGet]
        public async Task<ActionResult<Collection[]>> GetAllCollections(CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetAllCollections method called in CollectionController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
            var allCollections = await connection.QueryAsync<Collection>(command);

            _logger.LogInformation("Successfully retrieved all collections. Total collections: {allCollectionsLength}", allCollections.Count());
            return Ok(allCollections);
        }

        public record UpdateCollectionDto(string Name);

        // Update call for a specific collection
        [HttpPut("{collectionId:int}")]
        public async Task<IActionResult> Edit([FromRoute]int collectionId, [FromBody] UpdateCollectionDto dto, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Edit action called for collection: {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("PostUpdateCollectionById");
            var command = new CommandDefinition(sql, new { collectionId, name = dto.Name }, cancellationToken: cancellationToken);
            var updatedCollection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            if (updatedCollection == null)
            {
                _logger.LogWarning("Failed to edit collection with ID: {collectionId}", collectionId);
                return Problem(
                        title: "Database Error",
                        detail: $"Collection with ID {collectionId} was not found or could not be updated.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            _logger.LogInformation("Successfully edited collection with ID: {collectionId}", collectionId);
            return Ok(updatedCollection);
        }

        // DeleteCollection a specific collection
        [HttpDelete("{collectionId:int}")]
        public async Task<ActionResult<HttpStatusCode>> DeleteCollection([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("DeleteCollection action called for collection: {collectionId}", collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("DeleteCollectionById");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                _logger.LogWarning("Failed to delete collection with ID: {collectionId}", collectionId);
                return Problem(
                    title: "Collection not found",
                    detail: $"Failed to find any collection with ID {collectionId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            _logger.LogInformation("Successfully deleted collection with ID: {collectionId}", collectionId);
            return NoContent();
        }

        // Link a prompt to a collection
        [HttpPost("{collectionId:int}/prompts/{promptId:int}")]
        public async Task<IActionResult> LinkPromptToCollection([FromRoute] int collectionId, [FromRoute] int promptId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Attempt to link a prompt to a collection Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("PostInsertConnection");

            var command = new CommandDefinition(sql, new { promptId, collectionId }, cancellationToken: cancellationToken);
            var entryId = await connection.QuerySingleOrDefaultAsync<int?>(command);
            if (entryId == null)
            {
                _logger.LogError("Database returned no result when trying to connect Prompt {promptId} to Collection {collectionId}", promptId, collectionId);
                return Problem(
                        title: "Database Error",
                        detail: "The insert statement executed, but no ID was returned.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            else if (entryId <= 0)
            {
                _logger.LogWarning("Failed to create a new connection from Prompt {promptId} to Collection {collectionId}", promptId, collectionId);
                return Problem(
                        title: "Creation of connection Failed",
                        detail: "The database failed to generate a connection from the prompt to the collection.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }

            _logger.LogInformation("Successfully created a new connection with entryId: {entryId}", entryId);
            return Ok(entryId);
        }

        // Unlink a prompt from a collection
        [HttpDelete("{collectionId:int}/prompts/{promptId:int}")]
        public async Task<IActionResult> UnlinkPromptFromCollection([FromRoute] int collectionId, [FromRoute] int promptId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("UnlinkConnection action called for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("DeletePromptCollectionConnection");
            var command = new CommandDefinition(sql, new { promptId, collectionId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                _logger.LogWarning("Failed to delete connection for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
                return Problem(
                    title: "Connection not found",
                    detail: $"Failed to find any connection with collectionId {collectionId} and promptId {promptId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            _logger.LogInformation("Successfully deleted connection for Prompt: {promptId} - Collection: {collectionId}", promptId, collectionId);
            return NoContent();
        }

        // Get all prompts in a specific collection
        [HttpGet("all/{collectionId:int}")]
        public async Task<ActionResult<Prompt[]>> GetAllFromCollection([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetAllPrompts action called in PromptController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetAllFromCollection");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);
            var allPrompts = await connection.QueryAsync<Prompt>(command);

            _logger.LogInformation("Successfully retrieved all Prompts");
            return Ok(allPrompts);
        }

    }
}
