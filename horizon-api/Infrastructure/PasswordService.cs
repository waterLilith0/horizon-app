using Isopoh.Cryptography.Argon2;
using System.Security.Cryptography;
using System.Text;

namespace horizon_api.Infrastructure
{
    public readonly record struct PasswordHashResult(string Hash, int PepperVersion);

    public interface IPasswordService
    {
        int CurrentPepperVersion { get; }
        PasswordHashResult Hash(string password);
        bool Verify(string hash, int pepperVersion, string password);
        bool NeedsRehash(int pepperVersion);
    }

    public class PasswordService : IPasswordService
    {
        // Minimum OWASP-recommended profile: 19 MiB memory, 2 iterations, 1 lane.
        // Tune so a hash takes about 250 to 500 ms on your server.
        private const int MemoryKiB = 19 * 1024;
        private const int Iterations = 2;
        private const int Parallelism = 1;
        private const int MinPepperLength = 32;

        private readonly Dictionary<int, byte[]> _peppers = [];

        public int CurrentPepperVersion { get; }

        public PasswordService(IConfiguration configuration)
        {
            foreach (var section in configuration.GetSection("Security:Peppers").GetChildren())
            {
                if (!int.TryParse(section.Key, out var version) || version < 1)
                {
                    throw new InvalidOperationException(
                        $"Invalid pepper version '{section.Key}'. Use positive integers (Security__Peppers__1).");
                }

                var value = section.Value;
                if (string.IsNullOrWhiteSpace(value) || value.Length < MinPepperLength)
                {
                    throw new InvalidOperationException(
                        $"Pepper version {version} is missing or shorter than {MinPepperLength} characters.");
                }

                _peppers[version] = Encoding.UTF8.GetBytes(value);
            }

            if (!int.TryParse(configuration["Security:CurrentPepperVersion"], out var current)
                || !_peppers.ContainsKey(current))
            {
                throw new InvalidOperationException(
                    "Security:CurrentPepperVersion is missing or does not match a configured pepper.");
            }

            CurrentPepperVersion = current;
        }

        private static string ApplyPepper(byte[] pepper, string password) =>
            Convert.ToBase64String(HMACSHA256.HashData(pepper, Encoding.UTF8.GetBytes(password)));

        public PasswordHashResult Hash(string password)
        {
            var config = new Argon2Config
            {
                Type = Argon2Type.HybridAddressing,
                Version = Argon2Version.Nineteen,
                TimeCost = Iterations,
                MemoryCost = MemoryKiB,
                Lanes = Parallelism,
                Threads = Parallelism,
                Password = Encoding.UTF8.GetBytes(ApplyPepper(_peppers[CurrentPepperVersion], password)),
                HashLength = 32
            };

            return new PasswordHashResult(Argon2.Hash(config), CurrentPepperVersion);
        }

        public bool Verify(string hash, int pepperVersion, string password) =>
            _peppers.TryGetValue(pepperVersion, out var pepper)
            && Argon2.Verify(hash, ApplyPepper(pepper, password));

        public bool NeedsRehash(int pepperVersion) => pepperVersion != CurrentPepperVersion;
    }
}