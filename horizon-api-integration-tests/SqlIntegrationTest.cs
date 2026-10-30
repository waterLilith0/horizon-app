using Dapper;
using FluentAssertions;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using MySqlConnector;
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

        public async ValueTask InitializeAsync()
        {
            await Container.StartAsync();
            var connectionStringBuilder = new MySqlConnectionStringBuilder(Container.GetConnectionString())
            {
                AllowUserVariables = true
            };
            DataSource = new MySqlDataSource(connectionStringBuilder.ConnectionString);
        }

        public async ValueTask DisposeAsync()
        {
            // Reusable containers survive disposal, so stop and remove it explicitly once the last test finished.
            await Container.StopAsync();
            await Container.DisposeAsync();
        }
    }

    public class SqlIntegrationTest : IClassFixture<MySqlDatabaseFixture>, IAsyncLifetime
    {
        private const long TestUserId = 1;
        private readonly MySqlDatabaseFixture _dbFixture;
        private readonly string _realApiPath;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<SqlQueryStore> _sqlQueryStoreLogger;
        private MySqlDataSource MySqlDataSource => _dbFixture.DataSource;

        public SqlIntegrationTest(MySqlDatabaseFixture dbFixture)
        {
            _dbFixture = dbFixture;
            _realApiPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "horizon-api");
            _configuration = new ConfigurationBuilder()
                .SetBasePath(_realApiPath)
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();
            _webHostEnvironment = new TestWebHostEnvironment(_realApiPath);
            _sqlQueryStoreLogger = LoggerFactory.Create(_ => { }).CreateLogger<SqlQueryStore>();
        }

        private async Task<(MySqlConnection connection, SqlQueryStore sqlQueryStore)> InitializeConnectionAndQueryStore()
        {
            var connection = await MySqlDataSource.OpenConnectionAsync(TestContext.Current.CancellationToken);
            var sqlQueryStore = new SqlQueryStore(_webHostEnvironment, _configuration, _sqlQueryStoreLogger);
            return (connection, sqlQueryStore);
        }

        private sealed class TestWebHostEnvironment(string contentRootPath) : IWebHostEnvironment
        {
            public string ApplicationName { get; set; } = "horizon_api";
            public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
            public string WebRootPath { get; set; } = string.Empty;
            public string EnvironmentName { get; set; } = "Development";
            public string ContentRootPath { get; set; } = contentRootPath;
            public IFileProvider ContentRootFileProvider { get; set; } = new PhysicalFileProvider(contentRootPath);
        }

        public async ValueTask InitializeAsync()
        {
            await InitializeDatabaseSchemaAsync();
        }

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;

        private async Task InitializeDatabaseSchemaAsync()
        {
            await using var connection = await MySqlDataSource.OpenConnectionAsync(TestContext.Current.CancellationToken);
            var schemaSql = await File.ReadAllTextAsync(
                Path.Combine(AppContext.BaseDirectory, "Schema", "schema.mysql"),
                TestContext.Current.CancellationToken);

            await using var command = new MySqlCommand(schemaSql, connection);
            await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
        }

        private async Task<(long collectionId, string collectionName)> AddEntriesToCollectionDatabase()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            const string collectionName = "Mega Jackpot Spin";
            var sqlQuery = sqlQueryStore.Get("PostInsertCollection");
            var command = new CommandDefinition(sqlQuery, new { name = collectionName, @public = false, userId = TestUserId }, cancellationToken: TestContext.Current.CancellationToken);
            var collectionId = await connection.QuerySingleAsync<long>(command);

            return (collectionId, collectionName);
        }

        private async Task<(Prompt prompt, long collectionId)> AddEntriesToPromptsDatabase(long? collectionId = null, string promptName = "Mega Jackpot Spin", string promptType = "Wheel Spin", bool createCollectionWhenMissing = true)
        {
            var promptCollectionId = collectionId;
            if (!promptCollectionId.HasValue && createCollectionWhenMissing)
            {
                var insertedCollection = await AddEntriesToCollectionDatabase();
                promptCollectionId = insertedCollection.collectionId;
            }

            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("PostInsert");
            var command = new CommandDefinition(
                sqlQuery,
                new { PromptText = promptName, Type = promptType, CollectionId = promptCollectionId, Public = false, UserId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);

            var prompt = await connection.QuerySingleAsync<Prompt>(command);
            return (prompt, promptCollectionId ?? 0);
        }

        [Fact]
        public async Task PostInsertCollection_ShouldInsertCollectionIntoDatabase()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sqlQuery, new { pageSize = 100, offset = 0, userId = TestUserId, scope = "all" }, cancellationToken: TestContext.Current.CancellationToken);
            var collections = await connection.QueryAsync<Collection>(command);

            collections.Should().ContainSingle(collection =>
                collection.CollectionId == insertedCollection.collectionId &&
                collection.Name == insertedCollection.collectionName);
        }

        [Fact]
        public async Task GetCollectionById_ShouldReturnCollection_WhenCollectionExists()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetCollectionById");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId = insertedCollection.collectionId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            collection.Should().NotBeNull();
            collection!.Name.Should().Be(insertedCollection.collectionName);
        }

        [Fact]
        public async Task GetCollectionById_ShouldReturnNoCollection_WhenCollectionDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetCollectionById");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId = 9999, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            collection.Should().BeNull();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReadFromRealDatabase()
        {
            await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sqlQuery, new { pageSize = 100, offset = 0, userId = TestUserId, scope = "all" }, cancellationToken: TestContext.Current.CancellationToken);
            var results = await connection.QueryAsync<Collection>(command);

            results.Should().NotBeEmpty();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnQuery_WhenKeyExistsInRealEnvironment()
        {
            var (_, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var actualQuery = sqlQueryStore.Get("GetAllCollections");
            actualQuery.Should().MatchEquivalentOf("SELECT c.**FROM PromptCollections c*WHERE*c.userId = @userId*public*");
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnEmptyList_WhenNoCollectionsExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sqlQuery, new { pageSize = 100, offset = 0, userId = TestUserId, scope = "all" }, cancellationToken: TestContext.Current.CancellationToken);
            var collections = await connection.QueryAsync<Collection>(command);

            collections.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAllCollections_ShouldReturnCollections_WhenCollectionsExist()
        {
            await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetAllCollections");
            var command = new CommandDefinition(sqlQuery, new { pageSize = 100, offset = 0, userId = TestUserId, scope = "all" }, cancellationToken: TestContext.Current.CancellationToken);
            var collections = await connection.QueryAsync<Collection>(command);

            collections.Should().NotBeEmpty();
        }

        [Fact]
        public async Task PostUpdateCollectionById_ShouldUpdateCollection()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var updatedCollectionName = "Updated Collection Name";
            var sqlQuery = sqlQueryStore.Get("PostUpdateCollectionById");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId = insertedCollection.collectionId, name = updatedCollectionName, @public = false, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var updatedCollection = await connection.QuerySingleOrDefaultAsync<Collection>(command);

            updatedCollection.Should().NotBeNull();
            updatedCollection!.Name.Should().Be(updatedCollectionName);
        }

        [Fact]
        public async Task DeleteCollectionById_ShouldDeleteCollection()
        {
            var insertedCollection = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteCollectionById");
            var deleteCommand = new CommandDefinition(
                sqlQuery,
                new { collectionId = insertedCollection.collectionId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var deletedRows = await connection.ExecuteAsync(deleteCommand);

            deletedRows.Should().Be(1);

            var getByIdCommand = new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId = insertedCollection.collectionId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(getByIdCommand);

            collection.Should().BeNull();
        }

        [Fact]
        public async Task DeleteCollectionById_ShouldNotDeleteCollection_WhenCollectionDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteCollectionById");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId = 9999, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var deletedRows = await connection.ExecuteAsync(command);

            deletedRows.Should().Be(0);
        }

        // ------------------------------------------------------------------------------------------------- //
        // -------------------------------------- PromptsController ---------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //

        [Fact]
        public async Task PostInsert_ShouldInsertPromptsIntoDatabase()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetById");
            var command = new CommandDefinition(
                sqlQuery,
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            prompt.Should().NotBeNull();
            prompt!.PromptText.Should().Be(insertedPrompt.PromptText);
            prompt.Type.Should().Be(insertedPrompt.Type);
        }

        [Fact]
        public async Task GetById_ShouldReturnSpecificPrompt_WherePromptExists()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetById");
            var command = new CommandDefinition(
                sqlQuery,
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            prompt.Should().NotBeNull();
            prompt!.PromptText.Should().Be(insertedPrompt.PromptText);
        }

        [Fact]
        public async Task GetById_ShouldReturnSpecificPrompt_WherePromptDoesNotExist()
        {
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("GetById");
            var command = new CommandDefinition(
                sqlQuery,
                new { promptId = 9999, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            prompt.Should().BeNull();
        }

        [Fact]
        public async Task GetAll_ShouldReturnPrompts_WhenPromptsExistSpecificCollection()
        {
            var amount = 5;
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            for (int i = 0; i < amount; i++)
            {
                await AddEntriesToPromptsDatabase(collectionId, $"Prompt {i}", "Wheel Spin");
            }

            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            var sqlQuery = sqlQueryStore.Get("GetAllFromCollection");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompts = await connection.QueryAsync<Prompt>(command);

            prompts.Should().HaveCount(amount);
        }

        [Fact]
        public async Task GetAll_ShouldReturnNoPrompts_WhenNoPromptsExistSpecificCollection()
        {
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            var sqlQuery = sqlQueryStore.Get("GetAllFromCollection");
            var command = new CommandDefinition(
                sqlQuery,
                new { collectionId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompts = await connection.QueryAsync<Prompt>(command);

            prompts.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAll_ShouldReturnAllPrompts_WhenPromptsExist()
        {
            var amount = 5;
            for (int i = 0; i < amount; i++)
            {
                await AddEntriesToPromptsDatabase(promptName: $"Prompt {i}", promptType: "Wheel Spin");
            }

            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            var sqlQuery = sqlQueryStore.Get("GetAll");
            var command = new CommandDefinition(
                sqlQuery,
                new { pageSize = amount, offset = 0, userId = TestUserId, scope = "all" },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompts = await connection.QueryAsync<Prompt>(command);

            prompts.Should().HaveCount(amount);
        }

        [Fact]
        public async Task PostUpdateById_ShouldUpdateSpecificPrompt()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var updatedPromptText = "Updated Prompt PromptText";
            var updatedPromptType = "Updated Prompt Type";
            var sqlQuery = sqlQueryStore.Get("PostUpdateById");
            var command = new CommandDefinition(
                sqlQuery,
                new { promptId = insertedPrompt.PromptId, PromptText = updatedPromptText, Type = updatedPromptType, Public = false, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var updatedPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            updatedPrompt.Should().NotBeNull();
            updatedPrompt!.PromptText.Should().Be(updatedPromptText);
            updatedPrompt.Type.Should().Be(updatedPromptType);
        }

        [Fact]
        public async Task PostUpdateById_ShouldNotUpdatePromptWhenUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var command = new CommandDefinition(
                sqlQueryStore.Get("PostUpdateById"),
                new { promptId = insertedPrompt.PromptId, PromptText = "Hijacked", Type = "Hijacked", Public = false, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken);
            var updatedPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            updatedPrompt.Should().BeNull();
        }

        [Fact]
        public async Task GetById_ShouldNotReturnPrompt_WhenPromptIsPrivateAndUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var command = new CommandDefinition(
                sqlQueryStore.Get("GetById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            prompt.Should().BeNull();
        }

        [Fact]
        public async Task GetById_ShouldReturnPrompt_WhenPromptIsPublicAndUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            await connection.ExecuteAsync(new CommandDefinition(
                "UPDATE WheelSpinPrompts SET `public` = 1 WHERE promptId = @promptId",
                new { promptId = insertedPrompt.PromptId },
                cancellationToken: TestContext.Current.CancellationToken));

            var command = new CommandDefinition(
                sqlQueryStore.Get("GetById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);

            prompt.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAll_ShouldNotReturnPrivatePrompts_WhenUserIsNotOwner()
        {
            await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var command = new CommandDefinition(
                sqlQueryStore.Get("GetAll"),
                new { pageSize = 100, offset = 0, userId = TestUserId + 1, scope = "all" },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompts = await connection.QueryAsync<Prompt>(command);

            prompts.Should().BeEmpty();
        }

        [Fact]
        public async Task DeleteById_ShouldDeletePromptById()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var sqlQuery = sqlQueryStore.Get("DeleteById");
            var deleteCommand = new CommandDefinition(
                sqlQuery,
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var deletedRows = await connection.ExecuteAsync(deleteCommand);

            deletedRows.Should().Be(1);

            var getByIdCommand = new CommandDefinition(
                sqlQueryStore.Get("GetById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(getByIdCommand);

            prompt.Should().BeNull();
        }

        [Fact]
        public async Task DeleteById_ShouldNotDeletePromptWhenUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var deleteCommand = new CommandDefinition(
                sqlQueryStore.Get("DeleteById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken);
            var deletedRows = await connection.ExecuteAsync(deleteCommand);

            deletedRows.Should().Be(0);
        }

        [Fact]
        public async Task DeleteById_ShouldRemovePromptFromCollectionsWhenDeleted()
        {
            var (insertedPrompt, collectionId) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var deleteCommand = new CommandDefinition(
                sqlQueryStore.Get("DeleteById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken);
            var deletedRows = await connection.ExecuteAsync(deleteCommand);

            deletedRows.Should().Be(1);

            var remaining = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
                "SELECT COUNT(*) FROM PromptToCollection WHERE collectionId = @collectionId",
                new { collectionId },
                cancellationToken: TestContext.Current.CancellationToken));

            remaining.Should().Be(0);
        }

        [Fact]
        public async Task GetCollectionById_ShouldNotReturnCollection_WhenCollectionIsPrivateAndUserIsNotOwner()
        {
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            collection.Should().BeNull();
        }

        [Fact]
        public async Task GetCollectionById_ShouldReturnCollection_WhenCollectionIsPublicAndUserIsNotOwner()
        {
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            await connection.ExecuteAsync(new CommandDefinition(
                "UPDATE PromptCollections SET `public` = 1 WHERE collectionId = @collectionId",
                new { collectionId },
                cancellationToken: TestContext.Current.CancellationToken));

            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("GetCollectionById"),
                new { collectionId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            collection.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAllFromCollection_ShouldNotReturnPrivatePrompts_WhenUserIsNotOwner()
        {
            var (_, collectionId) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();
            await connection.ExecuteAsync(new CommandDefinition(
                "UPDATE PromptCollections SET `public` = 1 WHERE collectionId = @collectionId",
                new { collectionId },
                cancellationToken: TestContext.Current.CancellationToken));

            var prompts = await connection.QueryAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("GetAllFromCollection"),
                new { collectionId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            prompts.Should().BeEmpty();
        }

        [Fact]
        public async Task PostInsertConnection_ShouldNotLinkPrompt_WhenPromptIsPrivateAndUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase(createCollectionWhenMissing: false);
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var entryId = await connection.QuerySingleOrDefaultAsync<long?>(new CommandDefinition(
                sqlQueryStore.Get("PostInsertConnection"),
                new { collectionId, promptId = insertedPrompt.PromptId, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            entryId.Should().BeNull();
        }

        [Fact]
        public async Task PostInsertConnection_ShouldThrowDuplicateKey_WhenPromptAlreadyLinked()
        {
            var (insertedPrompt, collectionId) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var act = async () => await connection.QuerySingleOrDefaultAsync<long?>(new CommandDefinition(
                sqlQueryStore.Get("PostInsertConnection"),
                new { collectionId, promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken));

            (await act.Should().ThrowAsync<MySqlException>())
                .Which.ErrorCode.Should().Be(MySqlErrorCode.DuplicateKeyEntry);
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task SetVisibility_ShouldSetPromptVisibility_WhenUserIsOwner(bool isPublic)
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("SetVisibility"),
                new { promptId = insertedPrompt.PromptId, @public = isPublic, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken));

            prompt!.Public.Should().Be(isPublic);
        }

        [Fact]
        public async Task SetVisibility_ShouldReturnNoPrompt_WhenUserIsNotOwner()
        {
            var (insertedPrompt, _) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var prompt = await connection.QuerySingleOrDefaultAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("SetVisibility"),
                new { promptId = insertedPrompt.PromptId, @public = true, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            prompt.Should().BeNull();
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task SetCollectionVisibility_ShouldSetCollectionVisibility_WhenUserIsOwner(bool isPublic)
        {
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("SetCollectionVisibility"),
                new { collectionId, @public = isPublic, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken));

            collection!.Public.Should().Be(isPublic);
        }

        [Fact]
        public async Task SetCollectionVisibility_ShouldReturnNoCollection_WhenUserIsNotOwner()
        {
            var (collectionId, _) = await AddEntriesToCollectionDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var collection = await connection.QuerySingleOrDefaultAsync<Collection>(new CommandDefinition(
                sqlQueryStore.Get("SetCollectionVisibility"),
                new { collectionId, @public = true, userId = TestUserId + 1 },
                cancellationToken: TestContext.Current.CancellationToken));

            collection.Should().BeNull();
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task SetPromptsVisibilityInCollection_ShouldSetOwnedPromptsVisibility(bool isPublic)
        {
            var (insertedPrompt, collectionId) = await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("SetPromptsVisibilityInCollection"),
                new { collectionId, @public = isPublic, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken));
            var prompt = await connection.QuerySingleAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("GetById"),
                new { promptId = insertedPrompt.PromptId, userId = TestUserId },
                cancellationToken: TestContext.Current.CancellationToken));

            prompt.Public.Should().Be(isPublic);
        }

        [Fact]
        public async Task GetAll_ShouldReturnNothing_WhenScopeIsOthersAndPromptsAreOwnPrivate()
        {
            await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var prompts = await connection.QueryAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("GetAll"),
                new { pageSize = 100, offset = 0, userId = TestUserId, scope = "others" },
                cancellationToken: TestContext.Current.CancellationToken));

            prompts.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAll_ShouldReturnOwnPrompts_WhenScopeIsOwned()
        {
            await AddEntriesToPromptsDatabase();
            var (connection, sqlQueryStore) = await InitializeConnectionAndQueryStore();

            var prompts = await connection.QueryAsync<Prompt>(new CommandDefinition(
                sqlQueryStore.Get("GetAll"),
                new { pageSize = 100, offset = 0, userId = TestUserId, scope = "owned" },
                cancellationToken: TestContext.Current.CancellationToken));

            prompts.Should().HaveCount(1);
        }
    }
}
