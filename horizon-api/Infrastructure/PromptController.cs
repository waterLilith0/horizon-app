using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.Common;

namespace horizon_api.Infrastructure
{
    [ApiController]
    [Route("[controller]")]
    public class PromptController(SeriLogger logger, MySqlAccess mySqlAccess, SqlQueryStore sqlQueryStore) : Controller
    {
        private readonly SeriLogger _logger = logger;
        private readonly MySqlAccess _mySqlAccess = mySqlAccess;
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;
        public List<Prompt> AllPrompts { get; set; } = [];
        public List<int> AllPromptIds { get; set; } = [];

        private void ClearAllPrompts()
        {
            AllPrompts.Clear();
            _logger.LogInformation("Cleared All Prompts in PromptController.");
        }

        private void ClearAllIds()
        {
            AllPromptIds.Clear();
            _logger.LogInformation("Cleared All Prompt IDs in PromptController.");
        }

        private async Task GetAllPromptIds()
        {
            ClearAllIds();
            _logger.LogInformation("GetAllPromptIds method called in PromptController.");
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAllIds"));
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);
            for (int i = 0; await reader.ReadAsync(); i++)
            {
                CollectionIdCheck(reader);
                AllPromptIds.Add(reader.GetInt32("promptId"));
            }
        }

        private static int? CollectionIdCheck(DbDataReader reader)
        {
            return reader.IsDBNull(reader.GetOrdinal("collectionId"))
                            ? null
                            : reader.GetInt32("collectionId");
        }

        // GET: PromptController/checkstatus
        [HttpGet("checkstatus")]
        public async Task<IActionResult> GetCheck()
        {
            try
            {
                _logger.LogInformation("Successfully got to the PromptController.");
                return Ok("PromptController is running.");
            }
            catch (Exception e)
            {
                _logger.LogError("An error occurred while checking the PromptController.", e.Message);
                throw;
            }
        }

        // GET: PromptController/create/?CollectionId=5&promptText="Example"
        [HttpPost("create")]
        public async Task<IActionResult> PostCreate([FromQuery] int collectionId, [FromQuery] string promptText)
        {
            _logger.LogInformation("Create action called in PromptController with CollectionId: {CollectionId}, PromptText: {promptText}", collectionId.ToString(), promptText);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostInsert"));
            command.Parameters.AddWithValue("@collectionId", collectionId);
            command.Parameters.AddWithValue("@promptText", promptText.Trim('"'));
            var affectedRows = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (affectedRows > 0)
            {
                _logger.LogInformation("Successfully created a new prompt with CollectionId: {CollectionId}, PromptText: {promptText}", collectionId.ToString(), promptText);
                return await Task.FromResult<IActionResult>(Ok("Prompt created successfully."));
            }
            else
            {
                _logger.LogError("Failed to create a new prompt with CollectionId: {CollectionId}, PromptText: {promptText}", collectionId.ToString(), promptText);
                return await Task.FromResult<IActionResult>(StatusCode(500, "Failed to create prompt."));
            }
        }

        // GET: PromptController/prompt/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPrompt(int id)
        {
            _logger.LogInformation("Called for a specific prompt: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetById"));
            command.Parameters.AddWithValue("@promptId", id);
            command.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using (var reader = await _mySqlAccess.ExecuteQueryAsync(command))
            {
                if (await reader.ReadAsync())
                {
                    var temp = CollectionIdCheck(reader);
                    return Ok(new Prompt
                    {
                        PromptId = reader.GetInt32("promptId"),
                        PromptText = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            return NotFound("Could not find Prompt with ID: " + id);
        }

        // GET: PromptController/allprompts or PromptController/allprompts?CollectionId=5
        [HttpGet("allprompts")]
        public async Task<IActionResult> GetAllPrompts([FromQuery] int? collectionId)
        {
            ClearAllPrompts();
            _logger.LogInformation("GetAllPrompts action called in PromptController.");
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAll"));
            command.Parameters.AddWithValue("@collectionId", collectionId.HasValue ? collectionId.Value : DBNull.Value);
            using (var reader = await _mySqlAccess.ExecuteQueryAsync(command))
            {
                for (int i = 0; await reader.ReadAsync(); i++)
                {
                    var temp = CollectionIdCheck(reader);
                    AllPrompts.Add(new Prompt
                    {
                        PromptId = reader.GetInt32("promptId"),
                        PromptText = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            return Ok(AllPrompts);
        }

        // GET: PromptController/random or PromptController/random?CollectionId=5
        [HttpGet("random")]
        public async Task<IActionResult> GetRandomPrompt([FromQuery] int? collectionId)
        {
            Random randomizer = new();
            await GetAllPromptIds();
            int randomId;
            do
            {
                randomId = randomizer.Next(1, AllPromptIds.Where(t => t > 0).Max() + 1);
            }
            while (!AllPromptIds.Any(t => (t == randomId)));

            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetById"));
            command.Parameters.AddWithValue("@promptId", randomId);
            command.Parameters.AddWithValue("@collectionId", collectionId.HasValue ? collectionId.Value : DBNull.Value);
            using (var reader = await _mySqlAccess.ExecuteQueryAsync(command))
            {
                while (await reader.ReadAsync())
                {
                    var temp = CollectionIdCheck(reader);
                    return Ok(new Prompt
                    {
                        PromptId = reader.GetInt32("promptId"),
                        PromptText = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            _logger.LogInformation("Randomly got prompt: " + randomId, collectionId != null ? $"for collection {collectionId.Value}" : "");
            return NotFound("Could not find Prompt with ID: " + randomId);
        }

        // GET: PromptController/edit/5
        [HttpPost("edit/{id}")]
        public async Task<IActionResult> PostEdit(int id, [FromQuery] string promptText, [FromQuery] int collectionId)
        {
            _logger.LogInformation("Edit action called for prompt: " + id);
            Prompt oldPrompt = new();
            var oldCommand = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetById"));
            oldCommand.Parameters.AddWithValue("@promptId", id);
            oldCommand.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using (var reader = await _mySqlAccess.ExecuteQueryAsync(oldCommand))
            {
                if (await reader.ReadAsync())
                {
                    var temp = CollectionIdCheck(reader);
                    oldPrompt = new Prompt
                    {
                        PromptId = reader.GetInt32("promptId"),
                        PromptText = reader.GetString("promptText"),
                        CollectionId = temp
                    };
                    _logger.LogInformation("Successfully retrieved existing prompt with ID: " + id + " for editing. Current PromptText: " + oldPrompt.PromptText + ", Current CollectionId: " + (oldPrompt.CollectionId.HasValue ? oldPrompt.CollectionId.Value.ToString() : "null"));
                }
                else
                {
                    _logger.LogError("Failed to retrieve existing prompt with ID: " + id + " for editing.");
                    return await Task.FromResult<IActionResult>(NotFound("Could not find Prompt with ID: " + id));
                }
            }
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostUpdateById"));
            command.Parameters.AddWithValue("@promptId", id);
            command.Parameters.AddWithValue("@collectionId", collectionId != 0 ? collectionId : oldPrompt.CollectionId);
            command.Parameters.AddWithValue("@promptText", promptText != null ? promptText.Trim('"') : oldPrompt.PromptText);
            var affectedRows = await _mySqlAccess.ExecuteNonQueryAsync(command);
            return await Task.FromResult<IActionResult>(Ok(affectedRows.ToString() + " Rows affected"));
        }

        // GET: PromptController/delete/5
        [HttpDelete("delete/{id}")]
        public Task<IActionResult> Delete(int id)
        {
            _logger.LogInformation("Delete action called for prompt: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("DeleteById"));
            command.Parameters.AddWithValue("@promptId", id);
            var affectedRows = _mySqlAccess.ExecuteNonQueryAsync(command).Result;
            if (affectedRows > 0)
            {
                _logger.LogInformation("Successfully deleted prompt with ID: " + id);
                return Task.FromResult<IActionResult>(Ok("Prompt deleted successfully."));
            }
            else
            {
                _logger.LogError("Failed to delete prompt with ID: " + id);
                return Task.FromResult<IActionResult>(StatusCode(500, "Failed to delete prompt."));
            }
        }
    }
}
