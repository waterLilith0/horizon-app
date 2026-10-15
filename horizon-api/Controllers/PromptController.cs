using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Serilog;
using System.Data;
using System.Data.Common;

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PromptController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<PromptController> logger) : Controller
    {
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;
        private readonly ILogger<PromptController> _logger = logger;

        // Check if the allPrompts controller is running
        [HttpGet("checkstatus")]
        public async Task<IActionResult> GetCheck()
        {
            _logger.LogDebug("Successfully got to the PromptController.");
            return Ok("PromptController is running.");
        }

        public record CreatePromptDto(string PromptText, string Type, int? CollectionId);
        public record CreatePromptResponse(Prompt Prompt, int? CollectionId);

        // Create a new prompt; optionally insert it into a collection immediately
        [HttpPost]
        public async Task<ActionResult<CreatePromptResponse>> PostCreate([FromBody] CreatePromptDto promptDto, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Create action called in PromptController with: {@PromptDto}", promptDto);

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("PostInsert");

            var command = new CommandDefinition(sql, promptDto, cancellationToken: cancellationToken);

            var createdPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);
            if (createdPrompt == null)
            {
                _logger.LogError("Database returned no result when creating prompt with text: {PromptText}", promptDto.PromptText);
                return Problem(
                    title: "Database Error",
                    detail: "The insert statement executed, but no prompt record was returned.",
                    statusCode: StatusCodes.Status500InternalServerError
                );
            }
            var response = new CreatePromptResponse(createdPrompt, promptDto.CollectionId);

            _logger.LogInformation("Successfully created a new prompt with ID {PromptId}", createdPrompt.PromptId);
            return CreatedAtAction(nameof(GetPrompt), new { promptId = createdPrompt.PromptId }, response);
        }

        // Get a specific allPrompts
        [HttpGet("{promptId:int}")]
        public async Task<ActionResult<Prompt>> GetPrompt([FromRoute] int promptId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetPromptById method called in PromptController for allPrompts {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetById");
            var command = new CommandDefinition(sql, new { promptId }, cancellationToken: cancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                _logger.LogWarning("No allPrompts found with ID {prompt}", promptId);
                return Problem(
                        title: "ID not found",
                        detail: $"Prompt with ID {promptId} not found.",
                        statusCode: StatusCodes.Status404NotFound
                    );
            }
            _logger.LogInformation("Successfully retrieved allPrompts with ID {prompt}", promptId);
            return Ok(prompt);
        }

        // Get all prompts, optionally filtered by amount
        [HttpGet]
        public async Task<ActionResult<Prompt[]>> GetAllPrompts([FromQuery] int? resultAmount, CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetAllPrompts action called in PromptController.");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetAll");
            var command = new CommandDefinition(sql, new { resultAmount },cancellationToken: cancellationToken);
            var allPrompts = await connection.QueryAsync<Prompt>(command);

            _logger.LogInformation("Successfully retrieved all Prompts");
            return Ok(allPrompts);
        }

        // Get a random rowsAffected; optionally from a specific collection
        [HttpGet("random")]
        public async Task<ActionResult<Prompt>> GetRandomPrompt([FromQuery] int? collectionId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetRandomPrompt action called in PromptController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = _sqlQueryStore.Get("GetRandomPrompt");
            var command = new CommandDefinition(sql, new { collectionId }, cancellationToken: cancellationToken);

            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (prompt == null)
            {
                _logger.LogWarning("No prompts available for random selection (CollectionId: {CollectionId})", collectionId);
                return Problem(
                    title: "Not Found",
                    detail: "No prompts found to pick randomly from.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }

            _logger.LogInformation("Successfully retrieved random rowsAffected with ID {PromptId}", prompt.PromptId);
            return Ok(prompt);
        }

        public record UpdatePromptDto(string PromptText, string Type);

        // Update/edit old prompt
        [HttpPut("{promptId:int}")]
        public async Task<IActionResult> PostEdit([FromRoute]int promptId, [FromBody] UpdatePromptDto promptDto, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Edit action called for Prompt {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = _sqlQueryStore.Get("PostUpdateById");
            var command = new CommandDefinition(sql, new { promptId, promptDto.PromptText, promptDto.Type }, cancellationToken: cancellationToken);
            var updatedPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            if (updatedPrompt == null)
            {
                _logger.LogWarning("Couldn't find old rowsAffected with id {oldId} to update", promptId);
                return Problem(
                    title: "Not Found",
                    detail: $"Couldn't find rowsAffected with id {promptId}",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            _logger.LogInformation("Succesfully edited item with id {prompt}", promptId);
            return Ok(updatedPrompt);
        }

        // Deletes a specific prompt
        [HttpDelete("{promptId:int}")]
        public async Task<IActionResult> Delete(int promptId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Delete action called for Prompt {prompt}", promptId);
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var sql = _sqlQueryStore.Get("DeleteById");
            var command = new CommandDefinition(sql, new { promptId }, cancellationToken: cancellationToken);
            var rowsAffected = await connection.ExecuteAsync(command);

            if (rowsAffected == 0)
            {
                _logger.LogWarning("Failed to delete prompt with ID: {prompt}", promptId);
                return Problem(
                    title: "Prompt not found",
                    detail: $"Failed to find any prompt with ID {promptId}.",
                    statusCode: StatusCodes.Status404NotFound
                );
            }
            _logger.LogInformation("Succesfully deleted prompt with id {prompt}", promptId);
            return NoContent();
        }
    }
}
