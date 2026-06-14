using horizonapi.Infrastructure;
using MySqlConnector;

namespace horizonapi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var connectionString = builder.Configuration.GetConnectionString("DevelopmentConnection");

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
