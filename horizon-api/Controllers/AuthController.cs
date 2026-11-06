using Dapper;
using horizon_api.Infrastructure;
using horizon_api.Infrastructure.Email;
using horizon_api.Shared;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Security.Claims;

namespace horizon_api.Controllers
{
    [ApiController]
    [ApiExplorerSettings(GroupName = "internal")]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController(
        SqlQueryStore sqlQueryStore,
        MySqlDataSource dataSource,
        ILogger<AuthController> logger,
        IPasswordService passGen,
        IEmailSender emailSender,
        IOptions<EmailOptions> emailOptions) : ControllerBase
    {
        /// <summary>Request body for logging in.</summary>
        /// <param name="UserName">The account's user name.</param>
        /// <param name="Password">The account's password.</param>
        public record LoginRequest(
            [Required, StringLength(30, MinimumLength = 1)] string UserName,
            [Required, StringLength(128, MinimumLength = 8)] string Password);

        /// <summary>Request body for registering a new account.</summary>
        /// <param name="Email">The email address the verification link is sent to (up to 255 characters).</param>
        /// <param name="UserName">The desired user name (3-30 characters).</param>
        /// <param name="Password">The desired password (8-128 characters).</param>
        public record RegisterRequest(
            [Required, EmailAddress, StringLength(255)] string Email,
            [Required, StringLength(30, MinimumLength = 3)] string UserName,
            [Required, StringLength(128, MinimumLength = 8)] string Password);

        /// <summary>Request body for changing the password of the logged in user.</summary>
        /// <param name="CurrentPassword">The current password.</param>
        /// <param name="NewPassword">The new password (8-128 characters). Must differ from the current password.</param>
        public record ChangePasswordRequest(
            [Required, StringLength(128, MinimumLength = 8)] string CurrentPassword,
            [Required, StringLength(128, MinimumLength = 8)] string NewPassword);

        /// <summary>Request body for verifying an email address.</summary>
        /// <param name="Token">The verification token from the emailed link.</param>
        public record VerifyEmailRequest(
            [Required, StringLength(100, MinimumLength = 20)] string Token);

        /// <summary>Request body for resending the verification email.</summary>
        /// <param name="Email">The email address of the account.</param>
        public record ResendVerificationRequest(
            [Required, EmailAddress, StringLength(255)] string Email);

        /// <summary>Request body for requesting a password reset email.</summary>
        /// <param name="Email">The email address of the account.</param>
        public record ForgotPasswordRequest(
            [Required, EmailAddress, StringLength(255)] string Email);

        /// <summary>Request body for resetting a forgotten password.</summary>
        /// <param name="Token">The reset token from the emailed link.</param>
        /// <param name="NewPassword">The new password (8-128 characters).</param>
        public record ResetPasswordRequest(
            [Required, StringLength(100, MinimumLength = 20)] string Token,
            [Required, StringLength(128, MinimumLength = 8)] string NewPassword);

        /// <summary>The public profile of a user.</summary>
        public class UserProfile
        {
            /// <summary>The user ID.</summary>
            public required long UserId { get; set; }

            /// <summary>The user name.</summary>
            public required string UserName { get; set; } = "";

            /// <summary>When the account was created.</summary>
            public required DateTime CreationDate { get; set; }

            /// <summary>Whether the user is a developer account.</summary>
            public required bool Dev { get; set; }

            /// <summary>The user's email address.</summary>
            public required string Email { get; set; } = "";
        }

        /// <summary>Check username availability</summary>
        /// <remarks>Checks whether the username is free to use.</remarks>
        /// <param name="userName">The username to check.</param>
        /// <response code="200">Username is available.</response>
        /// <response code="400">Invalid username.</response>
        /// <response code="409">Username already exists.</response>
        /// <response code="429">Too many requests.</response>
        [HttpGet]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> UserNameCheck([FromQuery, Required, StringLength(30, MinimumLength = 3)] string userName, CancellationToken cancellationToken)
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

        /// <summary>Log in</summary>
        /// <remarks>Signs in with a username and password and sets the auth cookie.</remarks>
        /// <response code="200">Signed in. The auth cookie is set.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="401">Invalid credentials.</response>
        /// <response code="403">Email not verified.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken cancellationToken)
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

            if (!user.EmailVerified)
            {
                logger.LogInformation("Login rejected: email not verified");
                return Problem(
                    title: "Email not verified",
                    detail: "Verify your email address before signing in.",
                    statusCode: StatusCodes.Status403Forbidden);
            }

            if (passGen.NeedsRehash(user.PepperVersion))
            {
                var upgraded = passGen.Hash(req.Password);
                var updateSql = sqlQueryStore.Get("PutUpdatePassword");
                var updateCommand = new CommandDefinition(
                    updateSql,
                    new { passwordHash = upgraded.Hash, pepperVersion = upgraded.PepperVersion, userId = user.UserId },
                    cancellationToken: cancellationToken);
                await connection.ExecuteAsync(updateCommand);
            }

            var claims = new List<Claim> {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new(ClaimTypes.Name, user.UserName),
                new(ClaimTypes.Role, user.Dev ? "Dev" : "User"),
                new("sessionVersion", user.SessionVersion.ToString())
            };
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
            await HttpContext.SignInAsync(principal);
            logger.LogInformation("User successfully signed in");
            return Ok();
        }

        /// <summary>Log out</summary>
        /// <remarks>Signs out of the currently logged in account.</remarks>
        /// <response code="204">Signed out.</response>
        /// <response code="401">Not signed in.</response>
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return NoContent();
        }

        /// <summary>Get current user</summary>
        /// <remarks>Checks whether you're logged in and returns the current user's profile.</remarks>
        /// <response code="200">The current user's profile.</response>
        /// <response code="401">Not signed in.</response>
        [HttpGet("me")]
        [ProducesResponseType<UserProfile>(StatusCodes.Status200OK)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<UserProfile>> Me(CancellationToken cancellationToken)
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(idClaim, out var userId))
            {
                return Unauthorized();
            }

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var command = new CommandDefinition(
                sqlQueryStore.Get("GetSimpleUser"),
                new { userId },
                cancellationToken: cancellationToken);

            var profile = await connection.QuerySingleOrDefaultAsync<UserProfile>(command);

            if (profile is null)
            {
                await HttpContext.SignOutAsync();
                return Unauthorized();
            }

            return Ok(profile);
        }

        /// <summary>Register</summary>
        /// <remarks>Creates a new account and sends a verification email.</remarks>
        /// <response code="201">Account created. A verification email is sent.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="409">Username or email already registered.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType<UserProfile>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<ActionResult<UserProfile>> CreateUser([FromBody] RegisterRequest req, CancellationToken cancellationToken)
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
                await SendVerificationEmailAsync(connection, profile.UserId, profile.Email, profile.UserName, cancellationToken);
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

        /// <summary>Verify email</summary>
        /// <remarks>Verifies an email address using the emailed token.</remarks>
        /// <response code="204">Email verified.</response>
        /// <response code="400">Invalid or expired token.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("verify-email")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("Verify email action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var updated = await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("PutVerifyEmail"),
                new { tokenHash = SecureToken.Hash(req.Token) },
                cancellationToken: cancellationToken));

            if (updated == 0)
            {
                logger.LogInformation("Email verification rejected: invalid or expired token");
                return Problem(
                    title: "Invalid token",
                    detail: "The verification link is invalid or has expired.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            logger.LogInformation("Email verified");
            return NoContent();
        }

        /// <summary>Resend verification email</summary>
        /// <remarks>Always returns 204 so account existence isn't leaked.</remarks>
        /// <response code="204">Request accepted.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("resend-verification")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("Resend verification action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var user = await connection.QuerySingleOrDefaultAsync<User>(new CommandDefinition(
                sqlQueryStore.Get("GetUserByEmail"),
                new { email = req.Email },
                cancellationToken: cancellationToken));

            if (user is { EmailVerified: false })
            {
                await SendVerificationEmailAsync(connection, user.UserId, user.Email, user.UserName, cancellationToken);
            }

            return NoContent();
        }

        /// <summary>Forgot password</summary>
        /// <remarks>Sends a password reset email. Always returns 204 so account existence isn't leaked.</remarks>
        /// <response code="204">Request accepted.</response>
        /// <response code="400">Invalid request.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("Forgot password action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var user = await connection.QuerySingleOrDefaultAsync<User>(new CommandDefinition(
                sqlQueryStore.Get("GetUserByEmail"),
                new { email = req.Email },
                cancellationToken: cancellationToken));

            // Always return 204 so account existence isn't leaked.
            if (user is not null)
            {
                await SendPasswordResetEmailAsync(connection, user.UserId, user.Email, cancellationToken);
            }

            return NoContent();
        }

        /// <summary>Reset password</summary>
        /// <remarks>Sets a new password using a reset token.</remarks>
        /// <response code="204">Password updated.</response>
        /// <response code="400">Invalid request or expired token.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPost("reset-password")]
        [EnableRateLimiting("auth")]
        [AllowAnonymous]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("Reset password action called in AuthController");
            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var hashed = passGen.Hash(req.NewPassword);
            var updated = await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("PutResetPassword"),
                new
                {
                    tokenHash = SecureToken.Hash(req.Token),
                    passwordHash = hashed.Hash,
                    pepperVersion = hashed.PepperVersion
                },
                cancellationToken: cancellationToken));

            if (updated == 0)
            {
                logger.LogInformation("Password reset rejected: invalid or expired token");
                return Problem(
                    title: "Invalid token",
                    detail: "The password reset link is invalid or has expired.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            logger.LogInformation("Password reset completed");
            return NoContent();
        }

        /// <summary>Change password</summary>
        /// <remarks>Changes the password of the logged in user.</remarks>
        /// <response code="204">Password changed.</response>
        /// <response code="400">Invalid request or incorrect current password.</response>
        /// <response code="401">Not signed in.</response>
        /// <response code="429">Too many requests.</response>
        [HttpPut("password")]
        [EnableRateLimiting("auth")]
        [Consumes("application/json")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken cancellationToken)
        {
            logger.LogDebug("Change password action called in AuthController");

            if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            {
                return Unauthorized();
            }

            if (req.CurrentPassword == req.NewPassword)
            {
                return Problem(
                    title: "Invalid new password",
                    detail: "The new password must be different from the current password.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);

            var user = await connection.QuerySingleOrDefaultAsync<User>(new CommandDefinition(
                sqlQueryStore.Get("GetUserById"),
                new { userId },
                cancellationToken: cancellationToken));

            if (user is null)
            {
                await HttpContext.SignOutAsync();
                return Unauthorized();
            }

            if (!passGen.Verify(user.PasswordHash, user.PepperVersion, req.CurrentPassword))
            {
                logger.LogInformation("Password change rejected: current password incorrect");
                return Problem(
                    title: "Incorrect password",
                    detail: "The current password is incorrect.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var hashed = passGen.Hash(req.NewPassword);
            await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("PutUpdatePassword"),
                new { passwordHash = hashed.Hash, pepperVersion = hashed.PepperVersion, userId },
                cancellationToken: cancellationToken));

            logger.LogInformation("Password changed for user {UserId}", userId);
            return NoContent();
        }

        /// <summary>Delete account</summary>
        /// <remarks>Deletes the logged in account.</remarks>
        /// <response code="204">Account deleted.</response>
        /// <response code="401">Not signed in.</response>
        /// <response code="404">Account not found.</response>
        /// <response code="429">Too many requests.</response>
        [HttpDelete]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> DeleteUser(CancellationToken cancellationToken)
        {
            logger.LogDebug("User deletion action called in AuthController");

            if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            {
                return Unauthorized();
            }

            await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            var command = new CommandDefinition(
                sqlQueryStore.Get("DeleteUserById"),
                new { userId },
                cancellationToken: cancellationToken);

            var deletedRows = await connection.ExecuteAsync(command);

            if (deletedRows <= 0)
            {
                logger.LogInformation("Delete failed: user {UserId} not found", userId);
                await HttpContext.SignOutAsync();
                return Problem(
                    title: "User not found",
                    detail: "The user does not exist.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            await HttpContext.SignOutAsync();
            logger.LogInformation("Successfully deleted user {UserId}", userId);
            return NoContent();
        }

        private async Task SendTokenEmailAsync(
            MySqlConnection connection,
            long userId,
            string email,
            long templateId,
            string purpose,
            int validHours,
            Func<string, Dictionary<string, object?>> buildVariables,
            CancellationToken cancellationToken)
        {
            var (token, tokenHash) = SecureToken.Create();

            await connection.ExecuteAsync(new CommandDefinition(
                sqlQueryStore.Get("PutVerificationToken"),
                new { userId, tokenHash, purpose, hours = validHours },
                cancellationToken: cancellationToken));

            try
            {
                await emailSender.SendTemplateAsync(email, templateId, buildVariables(token), cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send token email for user {UserId}", userId);
            }
        }

        private Task SendVerificationEmailAsync(
            MySqlConnection connection, long userId, string email, string userName, CancellationToken cancellationToken)
        {
            var options = emailOptions.Value;
            return SendTokenEmailAsync(connection, userId, email, options.Templates.Verification, "verify-email", 24,
                token => new()
                {
                    ["userName"] = WebUtility.HtmlEncode(userName),
                    ["verificationLink"] = $"{options.VerificationUrl}?token={token}"
                },
                cancellationToken);
        }

        private Task SendPasswordResetEmailAsync(
            MySqlConnection connection, long userId, string email, CancellationToken cancellationToken)
        {
            var options = emailOptions.Value;
            return SendTokenEmailAsync(connection, userId, email, options.Templates.PasswordReset, "reset-password", 1,
                token => new() { ["passwordChangeLink"] = $"{options.PasswordResetUrl}?token={token}" },
                cancellationToken);
        }
    }
}
