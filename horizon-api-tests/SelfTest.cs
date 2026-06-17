using FluentAssertions;

namespace horizon_api_tests
{
    public class SelfTest
    {
        [Fact]
        public void Should_ReturnTrue_When_Called()
        {
            var value = true;
            value.Should().BeTrue();
        }
    }
}