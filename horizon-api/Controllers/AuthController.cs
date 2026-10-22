using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace horizon_api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        public record LoginRequest(string Email, string Password);
        public record UserDto(string Id, string Email, string[] Roles);

        [HttpPost("login")]
        [ProducesResponseType(typeof(UserDto), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Login(LoginRequest req)
        {
            // TODO: validate against your user store, hash with PasswordHasher<T>
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "1"), new(ClaimTypes.Email, req.Email) };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
            await HttpContext.SignInAsync(principal);
            return Ok(new UserDto("1", req.Email, []));
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
        public IActionResult Me() =>
            Ok(new UserDto(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!,
                User.FindFirstValue(ClaimTypes.Email)!,
                User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToArray()));
    }
}
