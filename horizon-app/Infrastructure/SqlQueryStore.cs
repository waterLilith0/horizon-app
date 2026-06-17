using horizon_app.Infrastructure;

namespace horizonapi.Infrastructure
{
    public sealed class SqlQueryStore
    {
        private readonly Dictionary<string, string> _queries = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private readonly SeriLogger _logger;

        public SqlQueryStore(IWebHostEnvironment _env, SeriLogger logger)
        {
            _logger = logger;

            var queryDirs = new List<string>(Directory.GetDirectories(Path.Combine(_env.ContentRootPath, "Infrastructure", "Queries")));

            foreach (var queryDir in queryDirs)
            {
                foreach (var file in Directory.GetFiles(queryDir, "*.sql"))
                {
                    _queries[Path.GetFileNameWithoutExtension(file)] = File.ReadAllText(file);
                }
            }
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
