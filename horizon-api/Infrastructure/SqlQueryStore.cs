using Serilog;
using System.Collections.Frozen;

namespace horizon_api.Infrastructure
{
    public sealed class SqlQueryStore
    {
        private readonly FrozenDictionary<string, string> _queries;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SqlQueryStore> _logger;

        public SqlQueryStore(IWebHostEnvironment _env, IConfiguration configuration, ILogger<SqlQueryStore> logger)
        {
            Dictionary<string, string> temp = new(StringComparer.OrdinalIgnoreCase);
            _configuration = configuration;
            _logger = logger;

            var folderPath = _configuration["SqlSettings:QueriesFolderPath"] ?? "none";
            _logger.LogInformation("Loading SQL queries from folder {folderPath}", folderPath);
            _logger.LogInformation("Content root path: {envContentRootPath}", _env.ContentRootPath);
            _logger.LogInformation("Full path to queries folder: {fullPathQueriesFolder}", Path.Combine(_env.ContentRootPath, folderPath));
            var queryDirs = new List<string>(Directory.GetDirectories(Path.Combine(_env.ContentRootPath, folderPath!)));

            foreach (var queryDir in queryDirs)
            {
                foreach (var file in Directory.GetFiles(queryDir, "*.sql"))
                {
                    temp[Path.GetFileNameWithoutExtension(file)] = File.ReadAllText(file);
                }
            }
            _queries = temp.ToFrozenDictionary();
        }

        public string Get(string key)
        {
            try
            {
                _queries.TryGetValue(key, out var query);
                if (query == null)
                {
                    _logger.LogError("Query '{key}' not found", key);
                    throw new ArgumentException("Query not found", nameof(key));
                }
                _logger.LogInformation("Successfully retrieved query {key}", key);
                return query;
            }
            catch (ArgumentException e)
            {
                _logger.LogError("Query {key} not found: {e.Message}", key, e.Message);
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError("Error retrieving query '{key}': {e.Message}", key, e.Message);
                throw;
            }
        }
    }
}
