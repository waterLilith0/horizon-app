using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Serilog;
using System.Data.Common;

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CollectionController(MySqlAccess mySqlAccess, SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<CollectionController> logger) : Controller
    {
        private readonly MySqlAccess _mySqlAccess = mySqlAccess;
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;
        private readonly ILogger<CollectionController> _logger = logger;

        private static int CollectionIdCheck(DbDataReader reader)
        {
            return reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
        }

        // GET: CollectionController/checkstatus
        [HttpGet("checkstatus")]
        public async Task<IActionResult> GetCheck()
        {
            try
            {
                _logger.LogInformation("Successfully got to the CollectionController.");
                return Ok("CollectionController is running.");
            }
            catch (Exception e)
            {
                _logger.LogError("An error occurred while checking the CollectionController.", e.Message);
                throw;
            }
        }

        // GET: CollectionController/create/?collectionName=Example
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] Collection collection)
        {
            _logger.LogInformation("Create action called in CollectionController with name:", collection.Name);
            await using var connection = await dataSource.OpenConnectionAsync();
            await using var command = await _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostInsertCollection"), connection);
            
            var id = command.LastInsertedId;
            command.Parameters.AddWithValue("@name", collection.Name);

            var createdCollection = new Collection { Id = (int)id, Name = collection.Name };

            var value = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (value != 0)
            {
                _logger.LogInformation("Successfully created a new collection with name:", collection.Name, "Lines affected: ", $"{value}");
                return CreatedAtAction(nameof(GetCollectionById), new { id = id }, collection);
            }
            else
            {
                _logger.LogError("Failed to create a new collection with name: ", collection.Name);
                return BadRequest();
            }
        }

        // TODO: edit old version of this
        // GET: CollectionController/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCollectionById(int id)
        {
            _logger.LogInformation("GetCollectionById method called in CollectionController for collection ID: " + id);
            await using var connection = await dataSource.OpenConnectionAsync();
            await using var command = await _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetCollectionById"), connection);

            command.Parameters.AddWithValue("@collectionId", id);
            
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);
            if (reader.Read())
            {
                var collection = new Collection
                {
                    Id = CollectionIdCheck(reader),
                    Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
                };
                _logger.LogInformation("Successfully retrieved collection with ID: ", id.ToString());
                return Ok(collection);
            }
            else
            {
                _logger.LogWarning("No collection found with ID: ", id.ToString());
                return NotFound($"Collection with ID {id} not found.");
            }
        }

        // GET: CollectionController/allcollections
        [HttpGet("allcollections")]
        public async Task<IActionResult> GetAllCollections()
        {
            List<Collection> allCollections = [];
            _logger.LogInformation("GetAllCollections method called in CollectionController.");

            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAllCollections"));
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);

            while (reader.Read())
            {
                allCollections.Add(new Collection
                {
                    Id = CollectionIdCheck(reader),
                    Name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
                });
            }

            _logger.LogInformation($"Successfully retrieved all collections. Total collections: {allCollections.Count}");
            return Ok(allCollections);
        }

        // GET: CollectionController/edit/5?newname="New Name"
        [HttpPost("edit/{id}")]
        public async Task<IActionResult> Edit(int id, [FromBody] string newName)
        {
            _logger.LogInformation("Edit action called for collection: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostUpdateCollectionById"));
            command.Parameters.AddWithValue("@collectionId", id);
            command.Parameters.AddWithValue("@name", newName);
            var reader = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (reader > 0)
            {
                _logger.LogInformation("Successfully edited collection with ID: ", id.ToString(), "Lines affected: ", $"{reader}");
                return Ok("Collection edited successfully.");
            }
            else
            {
                _logger.LogError("Failed to edit collection with ID: ", id.ToString());
                return StatusCode(500, "Failed to edit collection.");
            }
        }

        // GET: CollectionController/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            _logger.LogInformation("Delete action called for collection: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("DeleteCollectionById"));
            command.Parameters.AddWithValue("@collectionId", id);
            var reader = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (reader > 0)
            {
                _logger.LogInformation("Successfully deleted collection with ID: ", id.ToString(), "Lines affected: ", $"{reader}");
                return Ok("Collection deleted successfully.");
            }
            else
            {
                _logger.LogError("Failed to delete collection with ID: ", id.ToString());
                return StatusCode(500, "Failed to delete collection.");
            }
        }
    }
}
