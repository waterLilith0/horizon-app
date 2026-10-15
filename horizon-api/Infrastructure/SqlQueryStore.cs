using System.Collections.Frozen;

namespace horizon_api.Infrastructure
{
    public sealed class SqlQueryStore
    {
        private FrozenDictionary<string, string> _queries;
        private readonly SeriLogger _logger;
        private readonly IConfiguration _configuration;

        public SqlQueryStore(IWebHostEnvironment _env, SeriLogger logger, IConfiguration configuration)
        {
            Dictionary<string, string> temp = new(StringComparer.OrdinalIgnoreCase);
            _logger = logger;
            _configuration = configuration;

            var folderPath = _configuration["SqlSettings:QueriesFolderPath"] ?? "none";
            logger.LogInformation($"Loading SQL queries from folder: {folderPath}");
            logger.LogInformation($"Content root path: {_env.ContentRootPath}");
            logger.LogInformation($"Full path to queries folder: {Path.Combine(_env.ContentRootPath, folderPath)}");
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
                    _logger.LogError($"Query '{key}' not found");
                    throw new ArgumentException("Query not found", nameof(key));
                }
                _logger.LogInformation($"Successfully retrieved query '{key}'");
                return query;
            }
            catch (ArgumentException e)
            {
                _logger.LogError($"Query '{key}' not found: {e.Message}");
                throw;
            }
            catch (Exception e)
            {
                _logger.LogError($"Error retrieving query '{key}': {e.Message}");
                throw;
            }
        }
    }
}
