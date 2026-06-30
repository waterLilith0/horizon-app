using Serilog;

namespace horizon_api.Infrastructure
{
    /// <summary>
    /// SeriLogger is a logging utility class that provides methods for logging messages at various levels 
    /// (Information, Error, Warning, Debug, Verbose, Fatal) using the Serilog library. It initializes a logger 
    /// that writes logs to both the console and rolling log files. The class can be used throughout the application 
    /// to log important events and errors for debugging and monitoring purposes.
    /// </summary>
    /// <completionlist cref="SeriLogger"/>
    public class SeriLogger()
    {
        // TODO: Add OpenTelemetry sink for distributed tracing and telemetry collection in the future.
        private readonly Serilog.ILogger _logger = new LoggerConfiguration()
            .MinimumLevel.Verbose()
            .WriteTo.Console()
            .WriteTo.File("./logs/log-.log", rollingInterval: RollingInterval.Day)
            //.WriteTo.OpenTelemetry(
            //  endpoint: "http://localhost:4317",
            //  protocol: Serilog.Sinks.OpenTelemetry.OtlpProtocol.HttpProtobuf)
            .CreateLogger();

        private static string NullCheck(string? input) => input ?? string.Empty;

        private static string[] NullCheck(string[]? input) => input ?? [];

        /// <summary>
        /// Information logging method that logs informational messages using the Serilog logger.
        /// </summary>
        /// <param name="message"></param>
        public async void LogInformation(string? message, params string[]? restOfArgs)
        {
            _logger.Information(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }

        /// <summary>
        /// Error logging method that logs error messages using the Serilog logger.
        /// </summary>
        /// <param name="message"></param>
        public async void LogError(string? message, params string[]? restOfArgs)
        {
            _logger.Error(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }

        /// <summary>
        /// Warning logging method that logs warning messages using the Serilog logger.
        /// </summary>
        /// <param name="message"></param>
        public async void LogWarning(string? message, params string[]? restOfArgs)
        {
            _logger.Warning(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }

        /// <summary>
        /// Debug logging method that logs debug messages using the Serilog logger.
        /// </summary>
        /// <param name="message"></param>
        public async void LogDebug(string? message, params string[]? restOfArgs)
        {
            _logger.Debug(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }

        /// <summary>
        /// Verbose logging method that logs verbose messages using the Serilog logger. 
        /// Verbose logs are typically used for detailed debugging information that may not be necessary in production environments.
        /// </summary>
        /// <param name="message"></param>
        public async void LogVerbose(string? message, params string[]? restOfArgs)
        {
            _logger.Verbose(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }

        /// <summary>
        /// Fatal logging method that logs fatal error messages using the Serilog logger.
        /// </summary>
        /// <param name="message"></param>
        public async void LogFatal(string? message, params string[]? restOfArgs)
        {
            _logger?.Fatal(NullCheck(message) + string.Join(" ", NullCheck(restOfArgs)));
        }
    }
}