using FluentAssertions;

namespace horizon_api_integration_tests
{
    public class SelfTest
    {
        [Fact]
        public void ShouldReturnTrue_WhenCalled()
        {
            var value = true;
            value.Should().BeTrue();
        }
    }
}