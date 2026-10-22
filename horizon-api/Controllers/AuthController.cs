using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Shared;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace horizon_api.Controllers
{
    [ApiController]
    [ApiExplorerSettings(GroupName = "internal")]
    [Route("api/auth")]
    public class AuthController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<AuthController> logger, IPasswordService passGen) : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UserNameCheck([FromQuery]string userName, CancellationToken cancellationToken)
        {
            logger.LogDebug("Username available action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetUsernameAvailable");
            var command = new CommandDefinition(
                sql,
                new { userName },
                cancellationToken: cancellationToken);

            var createdUser = await connection.QueryAsync<string>(command);

            if (createdUser.Any())
            {
                logger.LogInformation("Username already exists");
                return Problem(
                    title: "Username already exists",
                    detail: "The same user already exists.",
                    statusCode: StatusCodes.Status409Conflict
                );
            }
            logger.LogInformation("Username is available");
            return Ok();
        }

        public record LoginRequest(string UserName, string Password);

        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login(LoginRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("User login action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("GetUserByUsername");
            var command = new CommandDefinition(
                sql,
                new { req.UserName },
                cancellationToken: cancellationToken);

            var user = await connection.QuerySingleOrDefaultAsync<User>(command);

            var verified = passGen.Verify(user?.PasswordHash, user?.PepperVersion ?? 0, req.Password);
            if (user == null || !verified)
            {
                return Unauthorized();
            }
            if (passGen.NeedsRehash(user.PepperVersion))
            {
                var upgraded = passGen.Hash(req.Password);
                var updateSql = sqlQueryStore.Get("UpdatePepper");
                var updateCommand = new CommandDefinition(
                    updateSql,
                    new { passwordHash = upgraded.Hash, pepperVersion = upgraded.PepperVersion, userId = user.UserId },
                    cancellationToken: cancellationToken);
                await connection.ExecuteAsync(updateCommand);
            }

            var claims = new List<Claim> {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()), 
                new(ClaimTypes.Name, user.UserName), 
                new(ClaimTypes.Role, user.Dev ? "Dev" : "User") 
            };
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
            await HttpContext.SignInAsync(principal);
            logger.LogInformation("User successfully signed in");
            return Ok();
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return NoContent();
        }

        public class UserProfile
        {
            public long UserId { get; set; }
            public string UserName { get; set; } = "";
            public DateTime CreationDate { get; set; }
            public bool Dev { get; set; }
            public string Email { get; set; } = "";
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<UserProfile>> Me(CancellationToken cancellationToken)
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(idClaim, out var userId))
            {
                return Unauthorized();
            }

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var command = new CommandDefinition(
                sqlQueryStore.Get("GetUserById"),
                new { userId },
                cancellationToken: cancellationToken);

            var profile = await connection.QuerySingleOrDefaultAsync<UserProfile>(command);

            if (profile is null)
            {
                // The cookie is valid, but the user no longer exists.
                await HttpContext.SignOutAsync();
                return Unauthorized();
            }

            return Ok(profile);
        }

        public record RegisterRequest(
            [Required, EmailAddress] string Email,
            [Required, StringLength(50, MinimumLength = 3)] string UserName,
            [Required, StringLength(128, MinimumLength = 8)] string Password
            );

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(User), 201)]
        public async Task<ActionResult<User>> CreateUser(RegisterRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("User registration action called in AuthController");
            var result = passGen.Hash(req.Password);

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = sqlQueryStore.Get("UserInsert");

            var command = new CommandDefinition(
                sql,
                new { userName = req.UserName, passwordHash = result.Hash, email = req.Email, pepperVersion = result.PepperVersion },
                cancellationToken: cancellationToken);

            try
            {
                var profile = await connection.QuerySingleAsync<UserProfile>(command);
                logger.LogInformation("Successfully created a new user");
                return StatusCode(StatusCodes.Status201Created, profile);
            }
            catch (MySqlException ex) when (ex.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
            {
                logger.LogInformation("Registration rejected: duplicate email or username");
                return Problem(
                    title: "Account already exists",
                    detail: "The username or email is already registered.",
                    statusCode: StatusCodes.Status409Conflict);
            }
        }
    }
}
