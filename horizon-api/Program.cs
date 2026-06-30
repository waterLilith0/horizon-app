using horizon_app.Infrastructure;
using horizonapi.Infrastructure;
using MySqlConnector;
using Serilog;

namespace horizon_app
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Serilog.Debugging.SelfLog.Enable(Console.Error);
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSerilog((services, loggerConfiguration) => loggerConfiguration
                .ReadFrom.Configuration(builder.Configuration));
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            SeriLogger logger = new();
            logger.LogDebug("Connected to Serilogger");

            // Add services to the container.
            builder.Services.AddAuthorization();
            builder.Services.AddMvc();
            builder.Environment.ApplicationName = "horizonapi";
            builder.Services.AddSingleton<SeriLogger>();
            builder.Services.AddSingleton<SqlQueryStore>();
            builder.Services.AddMySqlDataSource(connectionString!);
            builder.Services.AddTransient<MySqlAccess>();
            builder.Host.UseSerilog();

            logger.LogDebug("DI configured");

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (builder.Environment.IsProduction())
            {
                app.UseHttpsRedirection();
                app.UseHsts();
                app.UseAuthorization();
            }
            app.MapControllers();

            app.Run();
        }
    }
}
