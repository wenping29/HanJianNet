using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        => Ok(await auth.RegisterAsync(req));

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
        => Ok(await auth.LoginAsync(req));

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
        => Ok(new { user = await auth.GetUserAsync(CurrentUser.GetId(User)) });
}
