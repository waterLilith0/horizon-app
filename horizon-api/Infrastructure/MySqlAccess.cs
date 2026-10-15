using MySqlConnector;
using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;

namespace horizon_api.Infrastructure
{
    /// <summary>
    /// MySqlAccess is a utility class that provides methods for connecting to a MySQL database, executing queries, and managing the database connection. 
    /// It uses the MySql.Data library to interact with the MySQL database and includes logging functionality using the SeriLogger class to log important 
    /// events and errors during database operations.
    /// </summary>
    /// <completionlist cref="MySqlAccess"/>
    public partial class MySqlAccess(ILogger<MySqlAccess> logger)
    {
        private readonly ILogger<MySqlAccess> _logger = logger;

        private string CheckSqlFormat(string? sql)
        {
            var regex = SqlRegexMatch();

            if (string.IsNullOrWhiteSpace(sql))
            {
                _logger.LogError("SQL query is null or empty.");
                throw new ArgumentException("SQL query cannot be null or empty.");
            }

            if (!regex.IsMatch(sql))
            {
                _logger.LogError("Invalid SQL query format.");
                throw new ArgumentException("Invalid SQL query format.");
            }

            return sql;
        }

        /// <summary>
        /// CreateCommand method that creates and returns a MySqlCommand object with the specified query and the current MySQL connection. 
        /// It includes error handling to log wrong SQL formats and other exceptions that may occur during command creation.
        /// </summary>
        /// <param name="query">The SQL query to execute.</param>
        /// <returns>A MySqlCommand object.</returns>
        public async Task<MySqlCommand> CreateCommand(string? query, MySqlConnection connection)
        {
            query = CheckSqlFormat(query);
            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = query;
                _logger.LogInformation("MySql command created.");
                return command;
            }
            catch (Exception e)
            {
                _logger.LogError("Error occurred while creating MySql command: ", e.Message);
                throw;
            }
        }

        /// <summary>
        /// ExecuteQuery method that executes a given SQL query and returns a DbDataReader containing the results. 
        /// It manages the database connection by opening it asynchronously before executing the query and closing it afterward.
        /// </summary>
        /// <param name="command">The SQL command to execute asynchronously.</param>
        /// <returns>A DbDataReader containing the results of the query.</returns>
        public async Task<DbDataReader> ExecuteQueryAsync(MySqlCommand command)
        {
            try
            {
                var reader = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection);
                _logger.LogInformation($"MySql query executed successfully.");
                return reader;
            }
            catch (MySqlException e)
            {
                _logger.LogError($"Error occurred while executing MySql query: {e.ErrorCode}", e.Message);
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError($"General error occurred while executing MySql query: ", e.Message);
                throw;
            }
        }

        /// <summary>
        /// ExecuteNonQuery method that executes a given SQL non-query command (such as INSERT, UPDATE, DELETE) and returns the number of rows affected.
        /// </summary>
        /// <param name="command"></param>
        /// <returns></returns>
        public async Task<int> ExecuteNonQueryAsync(MySqlCommand command)
        {
            try
            {
                var affectedRows = await command.ExecuteNonQueryAsync();
                _logger.LogInformation($"MySql non-query executed successfully. Rows affected: {affectedRows}");
                return affectedRows;
            }
            catch (MySqlException e)
            {
                _logger.LogError($"Error occurred while executing MySql non-query: {e.ErrorCode}", e.Message);
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError($"General error occurred while executing MySql non-query: ", e.Message);
                throw;
            }
        }

        [GeneratedRegex(@"^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b", RegexOptions.IgnoreCase, "en-US")]
        private static partial Regex SqlRegexMatch();
    }
}
