using Dapper;
using horizon_api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MySqlConnector;
using System.Security.Claims;

namespace horizon_api.Controllers
{
    [ApiController]
    [Authorize]
    [ApiExplorerSettings(GroupName = "public")]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public class LibraryController(
        SqlQueryStore sqlQueryStore,
        MySqlDataSource dataSource,
        IMemoryCache cache,
        ILogger<LibraryController> logger) : ControllerBase
    {
        private const string PublicVersionCacheKey = "library-version-public";
        private static readonly TimeSpan PublicVersionCacheDuration = TimeSpan.FromSeconds(3);
        private static readonly TimeSpan UserVersionCacheDuration = TimeSpan.FromSeconds(1);

        // Shared by both endpoints so several tabs or clients polling at once cost one query per cache window.
        private async Task<string> GetCachedVersionAsync(string cacheKey, TimeSpan duration, string queryName, object? parameters, CancellationToken cancellationToken)
        {
            var version = await cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = duration;
                await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
                return await connection.QuerySingleAsync<string>(new CommandDefinition(
                    sqlQueryStore.Get(queryName),
                    parameters,
                    cancellationToken: cancellationToken));
            });
            return version!;
        }
        /// <summary>Response body for the library version.</summary>
        /// <param name="Version">An opaque value that changes whenever the user's prompts, collections or collection memberships change.</param>
        public record LibraryVersionResponse(string Version);

        /// <summary>Get library version</summary>
        /// <remarks>Returns an opaque version of the current user's library (prompts, collections and which prompts are in which collection, including visibility). 
        /// Compare it with the previously stored value to see whether anything changed, instead of downloading the full lists. The value is cached per user for 1 second.</remarks>
        /// <response code="200">The current library version.</response>
        [HttpGet("version")]
        [ProducesResponseType<LibraryVersionResponse>(StatusCodes.Status200OK)]
        public async Task<ActionResult<LibraryVersionResponse>> GetVersion(CancellationToken cancellationToken)
        {
            logger.LogDebug("GetVersion called in LibraryController");
            var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var version = await GetCachedVersionAsync(
                $"library-version-user:{userId}", UserVersionCacheDuration, "GetLibraryVersion", new { userId }, cancellationToken);
            return Ok(new LibraryVersionResponse(version));
        }

        /// <summary>Get public library version</summary>
        /// <remarks>Returns an opaque version of all public prompts, public collections and the links between them. 
        /// Works without logging in. The value is the same for everyone and is cached for a few seconds, so a change can take up to 3 seconds to show.</remarks>
        /// <response code="200">The current public library version.</response>
        [HttpGet("version/public")]
        [AllowAnonymous]
        [ProducesResponseType<LibraryVersionResponse>(StatusCodes.Status200OK)]
        public async Task<ActionResult<LibraryVersionResponse>> GetPublicVersion(CancellationToken cancellationToken)
        {
            logger.LogDebug("GetPublicVersion called in LibraryController");
            var version = await GetCachedVersionAsync(
                PublicVersionCacheKey, PublicVersionCacheDuration, "GetPublicLibraryVersion", null, cancellationToken);
            return Ok(new LibraryVersionResponse(version));
        }
    }
}
