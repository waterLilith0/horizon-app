using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.Net;

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
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

        // Create a single collection
        [HttpPost("create")]
        public async Task<ActionResult<Collection>> Create([FromBody] Collection collection, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Create action called in CollectionController with name: {collectionName}", collection.Name);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("PostInsertCollection");

            var command = new CommandDefinition(sql, new { name = collection.Name }, cancellationToken: cancellationToken);
            var collectionId = await connection.QuerySingleOrDefaultAsync<int?>(command);
            if (collectionId == null)
            {
                _logger.LogError("Database returned no result when creating collection with name: {collectionName}", collection.Name);
                return Problem(
                        title: "Database Error",
                        detail: "The insert statement executed, but no ID was returned.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }
            else if (collectionId <= 0)
            {
                _logger.LogWarning("Failed to create a new collection with name: {collectionName}", collection.Name);
                return Problem(
                        title: "Creation Failed",
                        detail: $"The database failed to generate a valid ID for the new collection.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
            }

            collection.CollectionId = collectionId.Value;
            _logger.LogInformation("Successfully created a new collection with name: {collectionName}", collection.Name);
            return CreatedAtAction(nameof(GetCollectionById), new { collectionId }, collection);
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

        // Delete a specific collection
        [HttpDelete("{collectionId:int}")]
        public async Task<ActionResult<HttpStatusCode>> Delete([FromRoute] int collectionId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Delete action called for collection: {collectionId}", collectionId);
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
    }
}
