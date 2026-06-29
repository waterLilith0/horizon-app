using horizon_app.Infrastructure;
using horizonapi.Infrastructure;
using MySqlConnector;

namespace horizon_app
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Serilog.Debugging.SelfLog.Enable(Console.Error);
            var builder = WebApplication.CreateBuilder(args);
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            // Add services to the container.
            builder.Services.AddAuthorization();
            builder.Services.AddMvc();
            builder.Environment.ApplicationName = "horizonapi";
            builder.Services.AddSingleton<SeriLogger>();
            builder.Services.AddSingleton<SqlQueryStore>();
            builder.Services.AddMySqlDataSource(connectionString!);
            builder.Services.AddTransient<MySqlAccess>();

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
