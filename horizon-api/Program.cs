using Grafana.OpenTelemetry;
using horizon_api.Infrastructure;
using MySqlConnector;
using Serilog;
using Serilog.Enrichers.Span;

namespace horizon_api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Verbose()
                .Enrich.FromLogContext()
                .Enrich.WithSpan()
                .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level}] {Message:lj}{Exception}{NewLine}")
                .WriteTo.File("./logs/log-.log", rollingInterval: RollingInterval.Day)
                //.WriteTo.OpenTelemetry(options =>
                //{
                //    options.Endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT") ?? "http://localhost:4317";
                //    options.Protocol = Serilog.Sinks.OpenTelemetry.OtlpProtocol.Grpc;
                //})
                .CreateLogger();

            Serilog.Debugging.SelfLog.Enable(Console.Error);

            try
            {
                Log.Information("Starting API");
                var builder = WebApplication.CreateBuilder(args);
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                builder.Environment.ApplicationName = "horizon-api";

                builder.Host.UseSerilog();
                builder.Services.AddOpenTelemetry()
                    .UseGrafana(o =>
                    {
                        o.ServiceName = "horizon-api";
                    });

                builder.Services.AddProblemDetails(options =>
                {
                    options.CustomizeProblemDetails = context =>
                    {
                        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
                    };
                });

                builder.Services.AddAuthorization();
                builder.Services.AddMvc();
                builder.Services.AddSingleton<SqlQueryStore>();
                builder.Services.AddMySqlDataSource(connectionString!);
                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen();

                Log.Debug("DI configured");

                var app = builder.Build();

                app.UseExceptionHandler();
                app.UseStatusCodePages();

                // Configure the HTTP request pipeline.
                if (builder.Environment.IsProduction())
                {
                    app.UseHttpsRedirection();
                    app.UseHsts();
                    app.UseAuthorization();
                }
                if (builder.Environment.IsDevelopment())
                {
                    app.UseSwagger();
                    app.UseSwaggerUI();
                }
                app.MapControllers();

                app.Run();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Application terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }
    }
}
