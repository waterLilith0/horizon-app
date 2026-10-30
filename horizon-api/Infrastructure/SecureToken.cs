using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace horizon_api.Shared;

public static class SecureToken
{
    public static (string Token, byte[] Hash) Create()
    {
        var token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
        return (token, Hash(token));
    }

    public static byte[] Hash(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token));
}