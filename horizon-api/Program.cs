using Grafana.OpenTelemetry;
using horizon_api.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MySqlConnector;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Enrichers.Span;
using System.Threading.RateLimiting;

namespace horizon_api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .Enrich.WithSpan()
                .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level}] {Message:lj}{Exception}{NewLine}")
                .WriteTo.File("./logs/log-.log", rollingInterval: RollingInterval.Day)
                .WriteTo.OpenTelemetry(options =>
                {
                    options.Endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT") ?? "http://localhost:4317";
                    options.Protocol = Serilog.Sinks.OpenTelemetry.OtlpProtocol.Grpc;
                })
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
                    })
                    .WithMetrics(metrics => metrics
                        .AddRuntimeInstrumentation()
                        .AddMeter("MySqlConnector")
                        .AddOtlpExporter(options =>
                        {
                            options.Endpoint = new Uri(Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT") ?? "http://localhost:4317");
                        }))
                    .WithTracing(tracing => tracing
                        .AddAspNetCoreInstrumentation(options =>
                        {
                            options.Filter = httpContext =>
                                !httpContext.Request.Path.StartsWithSegments("/healthz");
                        })
                        .AddHttpClientInstrumentation()
                        .AddOtlpExporter(options =>
                        {
                            options.Endpoint = new Uri(Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT") ?? "http://localhost:4317");
                        }));

                builder.Services.Configure<ForwardedHeadersOptions>(options =>
                {
                    options.ForwardedHeaders =
                        ForwardedHeaders.XForwardedFor |
                        ForwardedHeaders.XForwardedProto |
                        ForwardedHeaders.XForwardedHost;

                    options.KnownNetworks.Clear();
                    options.KnownProxies.Clear();
                });

                builder.Services.AddProblemDetails(options =>
                {
                    options.CustomizeProblemDetails = context =>
                    {
                        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
                    };
                });

                builder.Services.AddRateLimiter(options =>
                {
                    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                    options.OnRejected = async (context, token) =>
                    {
                        context.HttpContext.Response.Headers.RetryAfter = "60";
                        await context.HttpContext.Response.WriteAsync("Too many requests.", token);
                    };
                    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                        RateLimitPartition.GetFixedWindowLimiter(
                            partitionKey: httpContext.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
                            ?? httpContext.Connection.RemoteIpAddress?.ToString()
                            ?? "unknown",
                            factory: _ => new FixedWindowRateLimiterOptions
                            {
                                PermitLimit = 100,
                                Window = TimeSpan.FromMinutes(1),
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                QueueLimit = 15,
                                AutoReplenishment = true
                            }));
                });

                builder.Services.AddHealthChecks()
                    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" })
                    .AddMySql(
                        connectionString: connectionString!,
                        healthQuery: "mysql",
                        name: "mysql",
                        tags: new[] { "ready" }
                    );

                builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                    .AddCookie(o =>
                    {
                        o.Cookie.Name = "horizon.auth";
                        o.Cookie.HttpOnly = true;
                        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                        o.Cookie.SameSite = SameSiteMode.Lax;
                        o.SlidingExpiration = true;
                        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
                        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
                    });
                builder.Services.AddAuthorization();
                builder.Services.AddControllers();
                builder.Services.AddSingleton<SqlQueryStore>(); 
                builder.Services.AddSingleton<IPasswordService, PasswordService>();
                builder.Services.AddMySqlDataSource(connectionString!);

                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen(c =>
                {
                    c.SwaggerDoc("public", new() { Title = "Horizon API", Version = "v1.1.0" });
                    c.SwaggerDoc("internal", new() { Title = "Horizon Internal", Version = "v1.0.0" });
                });

                Log.Debug("DI configured");

                var app = builder.Build();

                app.UseForwardedHeaders();
                app.UseExceptionHandler();
                app.UseStatusCodePages();

                if (builder.Environment.IsProduction())
                {
                    app.UseHttpsRedirection();
                    app.UseHsts();
                }

                app.MapHealthChecks("healthz/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
                {
                    Predicate = check => check.Tags.Contains("live")
                }).DisableRateLimiting().AllowAnonymous();
                app.MapHealthChecks("healthz/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
                {
                    Predicate = check => check.Tags.Contains("ready")
                }).DisableRateLimiting().AllowAnonymous();

                app.UseSwagger(o => o.RouteTemplate = "openapi/{documentName}.json");
                app.MapScalarApiReference(options =>
                {
                    options.WithTitle("Horizon API")
                           .AddDocument("public", "Horizon API", "/openapi/public.json");

                    if (app.Environment.IsDevelopment())
                    {
                        options.AddDocument("internal", "Horizon Internal", "/openapi/internal.json");
                    }
                });

                app.UseAuthentication();
                app.UseAuthorization();
                app.UseRateLimiter();
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
