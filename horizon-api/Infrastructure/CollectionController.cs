using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using System.Data.Common;

namespace horizon_api.Infrastructure
{
    [ApiController]
    [Route("[controller]")]
    public class CollectionController(SeriLogger logger, MySqlAccess mySqlAccess, SqlQueryStore sqlQueryStore) : Controller
    {
        private readonly SeriLogger _logger = logger;
        private readonly MySqlAccess _mySqlAccess = mySqlAccess;
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;

        public List<Collection> AllCollections { get; set; } = [];

        private static int CollectionIdCheck(DbDataReader reader)
        {
            return reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
        }

        private void ClearAllCollections()
        {
            AllCollections.Clear();
            _logger.LogInformation("Cleared All Collections in CollectionController.");
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
        public async Task<IActionResult> Create([FromQuery] string name)
        {
            _logger.LogInformation("Create action called in CollectionController with name:", name);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostInsertCollection"));
            command.Parameters.AddWithValue("@name", name.Trim('"'));
            var reader = _mySqlAccess.ExecuteNonQueryAsync(command).Result;
            if (reader > 0)
            {
                _logger.LogInformation("Successfully created a new collection with name:", name, "Lines affected: ", $"{reader}");
                return await Task.FromResult<IActionResult>(Ok("Collection created successfully."));
            }
            else
            {
                _logger.LogError("Failed to create a new collection with name: ", name);
                return await Task.FromResult<IActionResult>(StatusCode(500, "Failed to create collection."));
            }
        }

        // GET: CollectionController/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCollectionById(int id)
        {
            _logger.LogInformation("GetCollectionById method called in CollectionController for collection ID: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetCollectionById"));
            command.Parameters.AddWithValue("@collectionId", id);
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);
            if (reader.Read())
            {
                var collection = new Collection
                {
                    CollectionId = CollectionIdCheck(reader),
                    CollectionName = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
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
            _logger.LogInformation("GetAllCollections method called in CollectionController.");
            AllCollections.Clear();

            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAllCollections"));
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);

            while (reader.Read())
            {
                AllCollections.Add(new Collection
                {
                    CollectionId = CollectionIdCheck(reader),
                    CollectionName = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
                });
            }

            _logger.LogInformation($"Successfully retrieved all collections. Total collections: {AllCollections.Count}");
            return Ok(AllCollections);
        }

        // GET: CollectionController/edit/5?newname="New Name"
        [HttpPost("edit/{id}")]
        public async Task<IActionResult> Edit(int id, [FromQuery] string newName)
        {
            _logger.LogInformation("Edit action called for collection: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostUpdateCollectionById"));
            command.Parameters.AddWithValue("@collectionId", id);
            command.Parameters.AddWithValue("@name", newName.Trim('"'));
            var reader = _mySqlAccess.ExecuteNonQueryAsync(command).Result;
            if (reader > 0)
            {
                _logger.LogInformation("Successfully edited collection with ID: ", id.ToString(), "Lines affected: ", $"{reader}");
                return await Task.FromResult<IActionResult>(Ok("Collection edited successfully."));
            }
            else
            {
                _logger.LogError("Failed to edit collection with ID: ", id.ToString());
                return await Task.FromResult<IActionResult>(StatusCode(500, "Failed to edit collection."));
            }
        }

        // GET: CollectionController/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            _logger.LogInformation("Delete action called for collection: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("DeleteCollectionById"));
            command.Parameters.AddWithValue("@collectionId", id);
            var reader = _mySqlAccess.ExecuteNonQueryAsync(command).Result;
            if (reader > 0)
            {
                _logger.LogInformation("Successfully deleted collection with ID: ", id.ToString(), "Lines affected: ", $"{reader}");
                return await Task.FromResult<IActionResult>(Ok("Collection deleted successfully."));
            }
            else
            {
                _logger.LogError("Failed to delete collection with ID: ", id.ToString());
                return await Task.FromResult<IActionResult>(StatusCode(500, "Failed to delete collection."));
            }
        }
    }
}
