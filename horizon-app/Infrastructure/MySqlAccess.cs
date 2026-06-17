using System.Data;
using System.Data.Common;
using System.Diagnostics;
using MySqlConnector;

namespace horizonapi.Infrastructure
{
    /// <summary>
    /// MySqlAccess is a utility class that provides methods for connecting to a MySQL database, executing queries, and managing the database connection. 
    /// It uses the MySql.Data library to interact with the MySQL database and includes logging functionality using the SeriLogger class to log important 
    /// events and errors during database operations.
    /// </summary>
    /// <completionlist cref="MySqlAccess"/>
    public class MySqlAccess(SeriLogger logger, MySqlDataSource dataSource) : IDisposable
    {
        /// <summary>
        /// ConnectionString is a property that holds the connection string used to connect to the MySQL database.
        /// </summary>
        /// <param name="connectionString">The connection string for the MySQL database.</param>
        private readonly SeriLogger _logger = logger;
        private readonly MySqlConnection _connection = new(dataSource.ConnectionString);

        private async Task OpenConnection()
        {
            if (_connection != null && _connection.State == System.Data.ConnectionState.Closed)
            {
                try
                {
                    await _connection.OpenAsync();
                    _logger.LogInformation("MySql asynchonously connection opened.");
                }
                catch (Exception e)
                {
                    _logger.LogError("Error occurred while opening MySql connection: ", e.Message);
                    throw;
                }
            }
        }

        private string CheckSqlFormat(string sql)
        {
            var regex = new System.Text.RegularExpressions
                .Regex(@"^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

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

        private async Task CloseConnection()
        {
            if (_connection != null && _connection.State == System.Data.ConnectionState.Open)
            {
                try
                {
                    await _connection.CloseAsync();
                    _logger.LogInformation("MySql connection closed.");
                }
                catch (Exception e)
                {
                    _logger.LogError("Error occurred while closing MySql connection: ", e.Message);
                    throw;
                }
            }
        }

        /// <summary>
        /// CreateCommand method that creates and returns a MySqlCommand object with the specified query and the current MySQL connection. 
        /// It includes error handling to log wrong SQL formats and other exceptions that may occur during command creation.
        /// </summary>
        /// <param name="query">The SQL query to execute.</param>
        /// <returns>A MySqlCommand object.</returns>
        public MySqlCommand CreateCommand(string query)
        {
            query = CheckSqlFormat(query);
            try
            {
                var command = new MySqlCommand(query, _connection);
                _logger.LogInformation("MySql command created with query: " + query);
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
            var requestTimer = Stopwatch.StartNew();
            await OpenConnection();
            try
            {
                var reader = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection);
                requestTimer.Stop();
                _logger.LogInformation($"MySql query executed successfully in {requestTimer.ElapsedMilliseconds} ms.");
                return reader;
            }
            catch (MySqlException e)
            {
                requestTimer.Stop();
                _logger.LogError($"Error occurred while executing MySql query after {requestTimer.ElapsedMilliseconds} ms: ", e.Message);
                await CloseConnection();
                throw;
            }
            catch (Exception e)
            {
                requestTimer.Stop();
                _logger.LogError($"General error occurred while executing MySql query after {requestTimer.ElapsedMilliseconds} ms: ", e.Message);
                await CloseConnection();
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
            var requestTimer = Stopwatch.StartNew();
            await OpenConnection();
            try
            {
                var affectedRows = await command.ExecuteNonQueryAsync();
                requestTimer.Stop();
                _logger.LogInformation($"MySql non-query executed successfully in {requestTimer.ElapsedMilliseconds} ms. Rows affected: {affectedRows}");
                return affectedRows;
            }
            catch (MySqlException e)
            {
                requestTimer.Stop();
                _logger.LogError($"Error occurred while executing MySql non-query after {requestTimer.ElapsedMilliseconds} ms: ", e.Message);
                await CloseConnection();
                throw;
            }
            catch (Exception e)
            {
                requestTimer.Stop();
                _logger.LogError($"General error occurred while executing MySql non-query after {requestTimer.ElapsedMilliseconds} ms: ", e.Message);
                await CloseConnection();
                throw;
            }
        }

        public async void Dispose()
        {
            GC.SuppressFinalize(this);
            await CloseConnection();
        }
    }
}
