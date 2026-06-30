using FluentAssertions;
using horizon_api.Infrastructure;

namespace horizon_api_tests
{
    public class SeriLoggerTest
    {
        private static readonly SeriLogger seriLogger = new();
        private readonly SeriLogger logger = seriLogger;


        [Fact]
        public void Should_ReturnNotNull_When_Called()
        {
            logger.Should().NotBeNull();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationIsCalled()
        {
            logger.Invoking(x => x.LogInformation("Test log information.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogWarningIsCalled()
        {
            logger.Invoking(x => x.LogWarning("Test log warning.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogErrorIsCalled()
        {
            logger.Invoking(x => x.LogError("Test log error.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogDebugIsCalled()
        {
            logger.Invoking(x => x.LogDebug("Test log debug.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogVerboseIsCalled()
        {
            logger.Invoking(x => x.LogVerbose("Test log verbose.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogFatalIsCalled()
        {
            logger.Invoking(x => x.LogFatal("Test log fatal.")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithArgsIsCalled()
        {
            logger.Invoking(x => x.LogInformation("Test log information with args.", "arg1", "arg2")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithNullArgsIsCalled()
        {
            logger.Invoking(x => x.LogInformation("Test log information with null args.", null)).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithMultipleArgsIsCalled()
        {
            logger.Invoking(x => x.LogInformation("Test log information with multiple args.", "arg1", "arg2", "arg3")).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithEmptyArgsIsCalled()
        {
            logger.Invoking(x => x.LogInformation("Test log information with empty args.", [])).Should().NotThrow();
        }

        [Fact]
        public void Should_NotThrow_When_LogInformationWithNullMessageIsCalled()
        {
            logger.Invoking(x => x.LogInformation(null)).Should().NotThrow();
        }
    }
}
