using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Data;
using System.Data.Common;

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PromptController(MySqlAccess mySqlAccess, SqlQueryStore sqlQueryStore) : Controller
    {
        private readonly MySqlAccess _mySqlAccess = mySqlAccess;
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;

        private async Task<List<int>> GetAllPromptIds(int? collectionId)
        {
            List<int> allPromptIds = [];
            Log.Information("GetAllPromptIds method called in PromptController.");
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAllIds"));
            command.Parameters.AddWithValue("@collectionId", collectionId);
            using var reader = await _mySqlAccess.ExecuteQueryAsync(command);
            for (int i = 0; await reader.ReadAsync(); i++)
            {
                CollectionIdCheck(reader);
                allPromptIds.Add(reader.GetInt32("promptId"));
            }
            return allPromptIds;
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
                Log.Information("Successfully got to the PromptController.");
                return Ok("PromptController is running.");
            }
            catch (Exception e)
            {
                Log.Error("An error occurred while checking the PromptController.", e.Message);
                throw;
            }
        }

        // GET: PromptController/create/?Id=5&promptText="Example"
        [HttpPost("create")]
        public async Task<IActionResult> PostCreate([FromQuery] int collectionId, [FromQuery] string promptText)
        {
            Log.Information("Create action called in PromptController with Id: {Id}, Text: {promptText}", collectionId.ToString(), promptText);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostInsert"));
            command.Parameters.AddWithValue("@collectionId", collectionId);
            command.Parameters.AddWithValue("@promptText", promptText.Trim('"'));
            var affectedRows = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (affectedRows > 0)
            {
                Log.Information("Successfully created a new prompt with Id: {Id}, Text: {promptText}", collectionId.ToString(), promptText);
                return Ok("Prompt created successfully.");
            }
            else
            {
                Log.Error("Failed to create a new prompt with Id: {Id}, Text: {promptText}", collectionId.ToString(), promptText);
                return StatusCode(500, "Failed to create prompt.");
            }
        }

        // GET: PromptController/prompt/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPrompt(int id)
        {
            Log.Information("Called for a specific prompt: " + id);
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
                        Id = reader.GetInt32("promptId"),
                        Text = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            return NotFound("Could not find Prompt with ID: " + id);
        }

        // GET: PromptController/allprompts or PromptController/allprompts?Id=5
        [HttpGet("allprompts")]
        public async Task<IActionResult> GetAllPrompts([FromQuery] int? collectionId)
        {
            List<Prompt> allPrompts = [];
            Log.Information("GetAllPrompts action called in PromptController.");
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("GetAll"));
            command.Parameters.AddWithValue("@collectionId", collectionId.HasValue ? collectionId.Value : DBNull.Value);
            using (var reader = await _mySqlAccess.ExecuteQueryAsync(command))
            {
                for (int i = 0; await reader.ReadAsync(); i++)
                {
                    var temp = CollectionIdCheck(reader);
                    allPrompts.Add(new Prompt
                    {
                        Id = reader.GetInt32("promptId"),
                        Text = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            return Ok(allPrompts);
        }

        // GET: PromptController/random or PromptController/random?Id=5
        [HttpGet("random")]
        public async Task<IActionResult> GetRandomPrompt([FromQuery] int? collectionId)
        {
            Random randomizer = new();
            var allPromptIds = await GetAllPromptIds(collectionId);
            int randomId;
            do
            {
                randomId = randomizer.Next(1, allPromptIds.Where(t => t > 0).Max() + 1);
            }
            while (!allPromptIds.Any(t => (t == randomId)));

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
                        Id = reader.GetInt32("promptId"),
                        Text = reader.GetString("promptText"),
                        CollectionId = temp
                    });
                }
            }
            Log.Information("Randomly got prompt: " + randomId, collectionId != null ? $"for collection {collectionId.Value}" : "");
            return NotFound("Could not find Prompt with ID: " + randomId);
        }

        // GET: PromptController/edit/5
        [HttpPost("edit/{id}")]
        public async Task<IActionResult> PostEdit(int id, [FromQuery] string promptText, [FromQuery] int collectionId)
        {
            Log.Information("Edit action called for prompt: " + id);
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
                        Id = reader.GetInt32("promptId"),
                        Text = reader.GetString("promptText"),
                        CollectionId = temp
                    };
                    Log.Information("Successfully retrieved existing prompt with ID: " + id + " for editing. Current Text: " + oldPrompt.Text + ", Current Id: " + (oldPrompt.CollectionId.HasValue ? oldPrompt.CollectionId.Value.ToString() : "null"));
                }
                else
                {
                    Log.Error("Failed to retrieve existing prompt with ID: " + id + " for editing.");
                    return NotFound("Could not find Prompt with ID: " + id);
                }
            }
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("PostUpdateById"));
            command.Parameters.AddWithValue("@promptId", id);
            command.Parameters.AddWithValue("@collectionId", collectionId != 0 ? collectionId : oldPrompt.CollectionId);
            command.Parameters.AddWithValue("@promptText", promptText != null ? promptText.Trim('"') : oldPrompt.Text);
            var affectedRows = await _mySqlAccess.ExecuteNonQueryAsync(command);
            return Ok(affectedRows.ToString() + " Rows affected");
        }

        // GET: PromptController/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            Log.Information("Delete action called for prompt: " + id);
            var command = _mySqlAccess.CreateCommand(_sqlQueryStore.Get("DeleteById"));
            command.Parameters.AddWithValue("@promptId", id);
            var affectedRows = await _mySqlAccess.ExecuteNonQueryAsync(command);
            if (affectedRows > 0)
            {
                Log.Information("Successfully deleted prompt with ID: " + id);
                return Ok("Prompt deleted successfully.");
            }
            else
            {
                Log.Error("Failed to delete prompt with ID: " + id);
                return StatusCode(500, "Failed to delete prompt.");
            }
        }
    }
}
