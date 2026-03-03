using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LeagueManagementApi.DTOs;

namespace LeagueManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config) => _config = config;

    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest req)
    {
        // Demo: accept admin/admin. In production use proper user store and password hashing.
        if (req.Username != "admin" || req.Password != "admin")
            return Unauthorized("Invalid credentials.");

        var key = _config["Jwt:Key"] ?? "LeagueManagementSecretKeyThatIsAtLeast32CharactersLong!";
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(24);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "LeagueManagementApi",
            audience: _config["Jwt:Audience"] ?? "LeagueManagementApp",
            claims: new[] { new Claim(ClaimTypes.Name, "admin"), new Claim(ClaimTypes.Role, "Admin") },
            expires: expires,
            signingCredentials: creds
        );
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return Ok(new LoginResponse { Token = tokenString, ExpiresAt = expires });
    }
}
