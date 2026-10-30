using Grafana.OpenTelemetry;
using horizon_api.Infrastructure;
using horizon_api.Infrastructure.Email;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using MySqlConnector;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Enrichers.Span;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;

namespace horizon_api
{
    public class Program
    {
        private const string CookieSchemeId = "cookieAuth";

        private static void ConfigureOpenApi(OpenApiOptions options, string title, string version, string description, params (string Name, string Description)[] tags)
        {
            options.AddDocumentTransformer((document, context, ct) =>
            {
                document.Info = new() { Title = title, Version = version, Description = description };
                document.Tags = new HashSet<OpenApiTag>(tags.Select(t => new OpenApiTag { Name = t.Name, Description = t.Description }));
                document.Components ??= new();
                document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
                {
                    [CookieSchemeId] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Cookie,
                        Name = "horizon.auth",
                        Description = "Session cookie issued by the login endpoint."
                    }
                };
                return Task.CompletedTask;
            });

            // Mark only [Authorize] endpoints as secured (skips [AllowAnonymous])
            options.AddOperationTransformer((operation, context, ct) =>
            {
                var metadata = context.Description.ActionDescriptor.EndpointMetadata;
                if (metadata.OfType<IAuthorizeData>().Any() && !metadata.OfType<IAllowAnonymous>().Any())
                {
                    operation.Security ??= [];
                    operation.Security.Add(new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference(CookieSchemeId, context.Document)] = []
                    });
                }
                return Task.CompletedTask;
            });
        }


        internal static void Main(string[] args)
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
                    .UseGrafana()
                    .WithMetrics(metrics => metrics
                        .AddMeter("MySqlConnector"))
                    .WithTracing(tracing => tracing
                        .AddAspNetCoreInstrumentation(options =>
                        {
                            options.Filter = httpContext =>
                                !httpContext.Request.Path.StartsWithSegments("/healthz");
                        }));

                builder.Services.Configure<ForwardedHeadersOptions>(options =>
                {
                    options.ForwardedHeaders =
                        ForwardedHeaders.XForwardedFor |
                        ForwardedHeaders.XForwardedProto |
                        ForwardedHeaders.XForwardedHost;
                    options.KnownIPNetworks.Clear();
                    options.KnownProxies.Clear();
                    options.KnownIPNetworks.Clear();
                    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(
                        builder.Configuration["ForwardedHeaders:TrustedNetwork"] ?? "172.28.0.0/16"));
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
                        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra)
                            ? (int)ra.TotalSeconds
                            : 60;
                        context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString();
                        await context.HttpContext.Response.WriteAsync("Too many requests.", token);
                    };

                    static string ClientIp(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                    // Limiter 1 - 3: per-user (generous) for authenticated requests, per-IP (stricter) for anonymous ones
                    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                    {
                        if (ctx.Request.Path.StartsWithSegments("/healthz"))
                        {
                            return RateLimitPartition.GetNoLimiter("health");
                        }

                        // Username availability check: called per keystroke, so it gets its own bucket
                        if (HttpMethods.IsGet(ctx.Request.Method) &&
                            ctx.Request.Path.Equals("/api/auth", StringComparison.OrdinalIgnoreCase))
                        {
                            return RateLimitPartition.GetSlidingWindowLimiter($"username:{ClientIp(ctx)}", _ => new SlidingWindowRateLimiterOptions
                            {
                                PermitLimit = 90,
                                Window = TimeSpan.FromMinutes(1),
                                SegmentsPerWindow = 6,
                                QueueLimit = 0,
                                AutoReplenishment = true
                            });
                        }

                        var userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (userId is not null)
                        {
                            return RateLimitPartition.GetFixedWindowLimiter($"user:{userId}", _ => new FixedWindowRateLimiterOptions
                            {
                                PermitLimit = 300,
                                Window = TimeSpan.FromMinutes(1),
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                QueueLimit = 15,
                                AutoReplenishment = true
                            });
                        }

                        return RateLimitPartition.GetFixedWindowLimiter($"ip:{ClientIp(ctx)}", _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 60,
                            Window = TimeSpan.FromMinutes(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 5,
                            AutoReplenishment = true
                        });
                    });

                    // Limiter 4: login / registration (brute-force protection), always per IP
                    options.AddPolicy("auth", ctx =>
                        RateLimitPartition.GetFixedWindowLimiter($"auth:{ClientIp(ctx)}", _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(5),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        }));
                });

                builder.Services.AddHealthChecks()
                    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
                    .AddMySql(
                        connectionString: connectionString!,
                        healthQuery: "SELECT 1;",
                        name: "mysql",
                        tags: ["ready"]
                    );

                var keysPath = builder.Configuration["DataProtection:KeysPath"]
                    ?? Path.Combine(builder.Environment.ContentRootPath, "keys");
                Directory.CreateDirectory(keysPath);

                builder.Services.AddDataProtection()
                    .SetApplicationName("horizon-api")
                    .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

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

                builder.Services
                    .AddOptions<EmailOptions>()
                    .Bind(builder.Configuration.GetSection(EmailOptions.SectionName))
                    .Validate(o => !string.IsNullOrWhiteSpace(o.ApiKey)
                          && !string.IsNullOrWhiteSpace(o.ApiSecret)
                          && !string.IsNullOrWhiteSpace(o.FromAddress),
                        "Email settings are incomplete.")
                    .ValidateOnStart();

                builder.Services.AddHttpClient<IEmailSender, MailjetEmailSender>((sp, client) =>
                {
                    var opts = sp.GetRequiredService<IOptions<EmailOptions>>().Value;
                    client.BaseAddress = new Uri("https://api.mailjet.com/");
                    client.Timeout = TimeSpan.FromSeconds(15);
                    var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{opts.ApiKey}:{opts.ApiSecret}"));
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
                });

                builder.Services.AddOpenApi("public", o => 
                    ConfigureOpenApi(o, 
                    "Horizon API", 
                    "v1.0.0", 
                    "Create and share prompts, organise them into collections, and spin them on the wheel.", 
                    ("Collection", "Named groups of prompts. Collections can be private or public."), 
                    ("Prompt", "Prompts owned by a user. Public prompts can be used by other users.")));
                builder.Services.AddOpenApi("internal", o => 
                ConfigureOpenApi(o, 
                    "Horizon Internal", 
                    "v1.0.0", 
                    "Account and session endpoints used by the Horizon app itself.", 
                    ("Auth", "Registration, sign-in, email verification and password management.")
                    ));

                Log.Debug("DI configured");

                var app = builder.Build();

                app.UseForwardedHeaders();
                app.UseExceptionHandler();
                app.UseStatusCodePages();

                if (builder.Environment.IsProduction())
                {
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

                // --------------------------------------------------------- // Scalar

                if (!app.Environment.IsDevelopment())
                {
                    app.Use(async (ctx, next) =>
                    {
                        if (ctx.Request.Path.Equals("/api/openapi/internal.json", StringComparison.OrdinalIgnoreCase))
                        {
                            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
                            return;
                        }
                        await next();
                    });
                }

                app.MapOpenApi("/api/openapi/{documentName}.json");
                app.MapScalarApiReference("/api/scalar", options =>
                {
                    options.WithTitle("Horizon API")
                           .AddDocument("public", "Horizon API", "/api/openapi/public.json");

                    if (app.Environment.IsDevelopment())
                    {
                        options.AddDocument("internal", "Horizon Internal", "/api/openapi/internal.json");
                    }
                });

                // --------------------------------------------------------- //

                app.UseAuthentication();
                app.UseRateLimiter();
                app.UseAuthorization();
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
