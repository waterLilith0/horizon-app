using Dapper;
using horizon_api.Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Org.BouncyCastle.Ocsp;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace horizon_api.Controllers
{
    [ApiController]
    [ApiExplorerSettings(GroupName = "internal")]
    [Route("api/auth")]
    public class AuthController(SqlQueryStore sqlQueryStore, MySqlDataSource dataSource, ILogger<AuthController> logger, IPasswordService passGen) : ControllerBase
    {
        private readonly SqlQueryStore _sqlQueryStore = sqlQueryStore;
        private readonly ILogger<AuthController> _logger = logger;
        private readonly IPasswordService _passGen = passGen;
        public record UserDto(long UserId, string UserName, DateTime CreationDate, bool Dev, string Email);

        public record LoginRequest(string UserName, string Email, string Password);

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<string>> UserNameCheck([FromQuery]string userName, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Username available action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("GetUsernameAvailable");
            var command = new CommandDefinition(
                sql,
                new { userName },
                cancellationToken: cancellationToken);

            var createdUser = await connection.QueryAsync<string>(command);

            if (createdUser.Any())
            {
                _logger.LogInformation("Username already exists");
                return Problem(
                    title: "Username already exists",
                    detail: "The same user already exists.",
                    statusCode: StatusCodes.Status409Conflict
                );
            }
            _logger.LogInformation("Username is available");
            return Ok();
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login(LoginRequest req, CancellationToken cancellationToken)
        {


            //if (user is null || !_passGen.Verify(user.PasswordHash, user.PepperVersion, req.Password))
            //{
            //    return Unauthorized();
            //}

            //if (_passGen.NeedsRehash(user.PepperVersion))
            //{
            //    var upgraded = _passGen.Hash(req.Password);
            //    await connection.ExecuteAsync(new CommandDefinition(
            //        "UPDATE users SET PasswordHash = @Hash, PepperVersion = @PepperVersion WHERE UserId = @UserId",
            //        new { upgraded.Hash, upgraded.PepperVersion, user.UserId },
            //        cancellationToken: cancellationToken));
            //}

            //var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "1"), new(ClaimTypes.Name, req.UserName), new(ClaimTypes.Email, req.Email) };
            //var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
            //await HttpContext.SignInAsync(principal);
            return Ok();
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return NoContent();
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(401)]
        public IActionResult Me()
        {
            return Ok();
        }

        public record RegisterRequest(
            [property: Required, EmailAddress] string Email,
            [property: Required, StringLength(50, MinimumLength = 3)] string UserName,
            [property: Required, StringLength(128, MinimumLength = 8)] string Password,
            bool? Dev
            );

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(UserDto), 201)]
        public async Task<ActionResult<UserDto>> CreateUser(RegisterRequest req, CancellationToken cancellationToken)
        {
            _logger.LogDebug("User registration action called in AuthController");
            var result = _passGen.Hash(req.Password);

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var sql = _sqlQueryStore.Get("UserInsert");

            var command = new CommandDefinition(
                sql,
                new { userName = req.UserName, passwordHash = result.Hash, dev = req.Dev, email = req.Email, pepperVersion = result.PepperVersion },
                cancellationToken: cancellationToken);

            var createdUser = await connection.QuerySingleOrDefaultAsync<UserDto>(command);

            if (createdUser == null)
            {
                _logger.LogInformation("Registration rejected: duplicate email or username");
                return Problem(
                    title: "Account already exists",
                    detail: "The insert statement executed, the same user already exists.",
                    statusCode: StatusCodes.Status409Conflict
                );
            }

            _logger.LogInformation("Successfully created a new user");
            return CreatedAtAction(null, createdUser);
            //var createdPrompt = await connection.QuerySingleOrDefaultAsync<Prompt>(command);
            //if (createdPrompt == null)
            //{
            //    _logger.LogError("Database returned no result when creating new user");
            //    return Problem(
            //        title: "Database Error",
            //        detail: "The insert statement executed, but no record was returned.",
            //        statusCode: StatusCodes.Status500InternalServerError
            //    );
            //}
            //var response = new CreatePromptResponse(createdPrompt, promptDto.CollectionId);

            //_logger.LogInformation("Successfully created a new user");
        }
    }
}
