using FluentAssertions;
using horizon_api.Infrastructure;
using MySqlConnector;

namespace horizon_api_tests
{
    public class MySqlAccessTest
    {
        private readonly SeriLogger serilogger = new();
        private readonly MySqlDataSource dataSource = new("server=localhost;user=root;password=password;database=test");

        [Fact]
        public void ShouldReturnNotNull_WhenInitialized()
        {

            var result = new MySqlAccess(serilogger, dataSource);
            result.Should().NotBeNull();
        }

        [Fact]
        public void ShouldReturnNotNull_WhenCreateCommandIsCalled()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            var query = "SELECT * FROM test_table";
            result.Invoking(x => x.CreateCommand(query)).Should().NotBeNull();
        }

        [Fact]
        public void ShouldReturnArgumentException_WhenCreateCommandIsCalledWithInvalidQuery()

        {
            var result = new MySqlAccess(serilogger, dataSource);
            var query = "INVALID QUERY";
            result.Invoking(x => x.CreateCommand(query)).Should().Throw<ArgumentException>();
        }

        [Fact]
        public void ShouldReturnArgumentException_WhenCreateCommandIsCalledWithNullQuery()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            var query = (string?)null;
            result.Invoking(x => x.CreateCommand(query: query)).Should().Throw<ArgumentException>();
        }

        [Fact]
        public void ShouldNotThrowAsync_WhenExecuteQueryAsyncIsCalled()

        {
            var result = new MySqlAccess(serilogger, dataSource);
            var command = result.CreateCommand("SELECT * FROM test_table");
            result.Awaiting(x => x.ExecuteQueryAsync(command)).Should().NotThrowAsync();
        }

        [Fact]
        public void ShouldReturnMySqlException_WhenExecuteQueryAsyncIsCalledWithInvalidCommand()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            var command = result.CreateCommand("SELECT * FROM non_existent_table");
            result.Awaiting(x => x.ExecuteQueryAsync(command)).Should().ThrowAsync<MySqlException>();
        }

        [Fact]
        public void ShouldReturnMySqlException_WhenExecuteNonQueryAsyncIsCalledWithInvalidCommand()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            var command = result.CreateCommand("INSERT INTO non_existent_table (name) VALUES ('test')");
            result.Awaiting(x => x.ExecuteNonQueryAsync(command)).Should().ThrowAsync<MySqlException>();
        }

        [Fact]
        public void ShouldReturnObjectDisposedException_WhenExecuteQueryAsyncIsCalledOnDisposedInstance()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            var command = result.CreateCommand("SELECT * FROM test_table");
            result.Dispose();
            result.Awaiting(x => x.ExecuteQueryAsync(command)).Should().ThrowAsync<ObjectDisposedException>();
        }

        [Fact]
        public void ShouldNotThrow_When_DisposeIsCalledMultipleTimes()
        {
            var result = new MySqlAccess(serilogger, dataSource);
            result.Dispose();
            result.Invoking(x => x.Dispose()).Should().NotThrow();
        }
    }
}
