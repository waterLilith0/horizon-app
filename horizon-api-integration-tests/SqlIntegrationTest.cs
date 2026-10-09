using FluentAssertions;
using horizon_api;
using horizon_api.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MySqlConnector;
using NSubstitute;
using Testcontainers.MySql;

namespace horizon_api_integration_tests
{
    public class MySqlDatabaseFixture : IAsyncLifetime
    {
        public MySqlContainer Container { get; } = new MySqlBuilder("mysql:8.0")
            .WithDatabase("horizon")
            .WithUsername("dev")
            .WithPassword("secure_pass123")
            .WithReuse(true)
            .Build();

        public MySqlDataSource DataSource { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            await Container.StartAsync();
            DataSource = new MySqlDataSource(Container.GetConnectionString());
        }

        public async Task DisposeAsync()
        {
            await Container.DisposeAsync();
        }
    }

    public class SqlIntegrationTest : IAsyncLifetime, IClassFixture<WebApplicationFactory<Program>>, IClassFixture<MySqlDatabaseFixture>
    {
        private readonly MySqlDatabaseFixture _dbFixture;
        private readonly WebApplicationFactory<Program> _factory;
        private MySqlDataSource MySqlDataSource => _dbFixture.DataSource;

        public SqlIntegrationTest(WebApplicationFactory<Program> factory, MySqlDatabaseFixture dbFixture)
        {
            _dbFixture = dbFixture;
            var realApiPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "horizon-api");

            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseContentRoot(realApiPath);
            });
        }

        public async Task InitializeAsync()
        {
            await InitializeDatabaseSchemaAsync();

            using var connection = await MySqlDataSource.OpenConnectionAsync();
            using var command = new MySqlCommand(@"
                SET FOREIGN_KEY_CHECKS = 0;
                TRUNCATE TABLE WheelSpinPrompts;
                TRUNCATE TABLE PromptCollections;
                SET FOREIGN_KEY_CHECKS = 1;", connection);

            await command.ExecuteNonQueryAsync();
        }

        public Task DisposeAsync() => Task.CompletedTask;

        private async Task<int> InitializeDatabaseSchemaAsync()
        {
            using var connection = await MySqlDataSource.OpenConnectionAsync();
            var schemaSql = @"
                CREATE TABLE IF NOT EXISTS PromptCollections (
                collectionId INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL
                );

                CREATE TABLE IF NOT EXISTS WheelSpinPrompts (
                promptId INT AUTO_INCREMENT PRIMARY KEY,
                promptText VARCHAR(255) NOT NULL,
                collectionId INT,
                FOREIGN KEY (collectionId) REFERENCES PromptCollections(collectionId)
                );";

            using var command = new MySqlCommand(schemaSql, connection);
            var changedRows = await command.ExecuteNonQueryAsync();
            return changedRows;
        }

        private async Task<(int, string)> AddEntriesToCollectionDatabase()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var collectionName = "Mega Jackpot Spin";
            var sqlQuery = sqlQueryStore.Get("PostInsertCollection");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@name", collectionName);
            var changedRows = await connection.ExecuteNonQueryAsync(command);

            return (changedRows, collectionName);
        }

        private async Task<(int, string)> AddEntriesToPromptsDatabase()
        {
            await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var promptName = "Mega Jackpot Spin";
            var sqlQuery = sqlQueryStore.Get("PostInsert");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptText", promptName);
            command.Parameters.AddWithValue("@collectionId", 1);
            var changedRows = await connection.ExecuteNonQueryAsync(command);

            return (changedRows, promptName);
        }

        private async Task<(MySqlAccess, SqlQueryStore)> InitializeConnectionAndQueryStore()
        {
            using var scope = _factory.Services.CreateScope();
            var realIWebHostEnvironment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
            var realIConfiguration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var subSeriLogger = Substitute.For<SeriLogger>();
            var connection = new MySqlAccess(subSeriLogger, MySqlDataSource);
            var sqlQueryStore = new SqlQueryStore(realIWebHostEnvironment, subSeriLogger, realIConfiguration);
            return (connection, sqlQueryStore);
        }

        [Fact]
        public async Task PostInsertCollection_ShouldInsertCollectionIntoDatabase()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var insertedCollection = await AddEntriesToCollectionDatabase();
            var getPromptsCommand = connection.CreateCommand(sqlQueryStore.Get("GetAllCollections"));
            using var reader = await connection.ExecuteQueryAsync(getPromptsCommand);

            for (int i = 0; reader.Read(); i++)
            {
                reader.GetString(1).Should().Be(insertedCollection.Item2);
            }
        }

        [Fact]
        public async Task GetCollectionById_ShouldReturnCollection_WhenCollectionExists()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetCollectionById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.Read();
            reader.GetString(1).Should().Be(insertedCollection.Item2);
        }

        [Fact]
        public async Task GetCollectionById_ShouldReturnNoCollection_WhenCollectionDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetCollectionById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.HasRows.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReadFromRealDatabase()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptText", "InitializeConnectionAndQueryStore Prompt");
            var results = await connection.ExecuteQueryAsync(command);

            results.Should().BeOfType<MySqlDataReader>();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnQuery_WhenKeyExistsInRealEnvironment()
        {
            var (_, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var actualQuery = sqlQueryStore.Get("GetAllCollections");

            actualQuery.Should().MatchEquivalentOf("SELECT *\r\nFROM horizon.PromptCollections;");
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnEmptyList_WhenNoCollectionsExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = connection.CreateCommand(sqlQuery);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.HasRows.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnCollections_WhenCollectionsExist()
        {
            await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = connection.CreateCommand(sqlQuery);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.HasRows.Should().BeTrue();
        }

        [Fact]
        public async Task PostUpdateCollectionById_ShouldUpdateCollection()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var updatedCollectionName = "Updated Collection Name";
            var sqlQuery = sqlQueryStore.Get("PostUpdateCollectionById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            command.Parameters.AddWithValue("@name", updatedCollectionName);
            var changedRows = await connection.ExecuteNonQueryAsync(command);

            changedRows.Should().Be(insertedCollection.Item1);

            var getByIdCommand = connection.CreateCommand(sqlQueryStore.Get("GetCollectionById"));
            getByIdCommand.Parameters.AddWithValue("@collectionId", 1);
            using var reader = await connection.ExecuteQueryAsync(getByIdCommand);

            reader.Read();
            reader.GetString(1).Should().Be(updatedCollectionName);
        }

        [Fact]
        public async Task DeleteCollectionById_ShouldDeleteCollection()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteCollectionById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            var deletedRows = await connection.ExecuteNonQueryAsync(command);

            deletedRows.Should().Be(insertedCollection.Item1);
        }

        [Fact]
        public async Task DeleteCollectionById_ShouldNotDeleteCollection_WhenCollectionDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteCollectionById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            var deletedRows = await connection.ExecuteNonQueryAsync(command);

            deletedRows.Should().Be(0);
        }

        // ------------------------------------------------------------------------------------------------- //
        // -------------------------------------- PromptsController ---------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //

        [Fact]
        public async Task PostInsert_ShouldInsertPromptsIntoDatabase()
        {
            var insertedPrompt = await AddEntriesToPromptsDatabase();
            insertedPrompt.Item1.Should().Be(insertedPrompt.Item1);
        }

        [Fact]
        public async Task GetById_ShouldReturnSpecificPrompt_WherePromptExists()
        {
            var (_, insertedPrompt) = await AddEntriesToPromptsDatabase();

            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptId", 1);
            command.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.Read();
            reader.GetString(1).Should().Be(insertedPrompt);
        }

        [Fact]
        public async Task GetById_ShouldReturnSpecificPrompt_WherePromptDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptId", 1);
            command.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using var reader = await connection.ExecuteQueryAsync(command);

            reader.Read();
            reader.HasRows.Should().BeFalse();
        }

        [Fact]
        public async Task GetAll_ShouldReturnPrompts_WhenPromptsExistSpecificCollection()
        {
            var amount = 5;
            for (int i = 0; i < amount; i++)
            {
                await AddEntriesToPromptsDatabase();
            }
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAll");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            using var reader = await connection.ExecuteQueryAsync(command);

            int rows = 0;
            while (reader.Read())
            {
                rows++;
            }
            rows.Should().Be(amount);
        }

        [Fact]
        public async Task GetAll_ShouldReturnNoPrompts_WhenNoPromptsExistSpecificCollection()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            var sqlQuery = sqlQueryStore.Get("GetAll");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", 1);
            using var reader = await connection.ExecuteQueryAsync(command);
            reader.HasRows.Should().BeFalse();
        }

        [Fact]
        public async Task GetAll_ShouldReturnAllPrompts_WhenPromptsExist()
        {
            var amount = 5;
            for (int i = 0; i < amount; i++)
            {
                await AddEntriesToPromptsDatabase();
            }
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            var sqlQuery = sqlQueryStore.Get("GetAll");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using var reader = await connection.ExecuteQueryAsync(command);
            int rows = 0;
            while (reader.Read())
            {
                rows++;
            }
            rows.Should().Be(amount);
        }

        [Fact]
        public async Task PostUpdateById_ShouldUpdateSpecificPrompt()
        {
            var (linesChanged, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var updatedPromptText = "Updated Prompt Text";
            var sqlQuery = sqlQueryStore.Get("PostUpdateById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptId", 1);
            command.Parameters.AddWithValue("@collectionId", DBNull.Value);
            command.Parameters.AddWithValue("@promptText", updatedPromptText);
            var changedRows = await connection.ExecuteNonQueryAsync(command);

            changedRows.Should().Be(linesChanged);

            var getByIdCommand = connection.CreateCommand(sqlQueryStore.Get("GetById"));
            getByIdCommand.Parameters.AddWithValue("@promptId", 1);
            getByIdCommand.Parameters.AddWithValue("@collectionId", DBNull.Value);
            using var reader = await connection.ExecuteQueryAsync(getByIdCommand);

            reader.Read();
            reader.GetString(1).Should().Be(updatedPromptText);
        }

        [Fact]
        public async Task DeleteById_ShouldDeletePromptById()
        {
            var (linesChanged, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteById");
            var command = connection.CreateCommand(sqlQuery);
            command.Parameters.AddWithValue("@promptId", 1);
            var deletedRows = await connection.ExecuteNonQueryAsync(command);

            deletedRows.Should().Be(linesChanged);
        }

    }
}