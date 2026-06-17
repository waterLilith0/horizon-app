using FluentAssertions;

namespace horizon_api_tests
{
    public class SeriLoggerTest
    {
        [Fact]
        public void Should_ReturnNotNull_When_Called()
        {
            var result = new horizonapi.Infrastructure.SeriLogger();
            result.Should().NotBeNull();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation("Test log information.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogWarningIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogWarning("Test log warning.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogErrorIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogError("Test log error.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogDebugIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogDebug("Test log debug.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogVerboseIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogVerbose("Test log verbose.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogFatalIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogFatal("Test log fatal.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithArgsIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation("Test log information with args.", "arg1", "arg2")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithNullArgsIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation("Test log information with null args.", null)).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithMultipleArgsIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation("Test log information with multiple args.", "arg1", "arg2", "arg3")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithEmptyArgsIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation("Test log information with empty args.", new string[0])).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithNullMessageIsCalled()
        {
            var logger = new horizonapi.Infrastructure.SeriLogger();
            logger.Invoking(x => x.LogInformation(null)).Should().NotThrow();
        }
    }
}
