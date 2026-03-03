using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeagueManagementApi.DTOs;
using LeagueManagementApi.Services;

namespace LeagueManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;

    public LeaderboardController(ILeaderboardService leaderboardService) => _leaderboardService = leaderboardService;

    [HttpGet("leagues/{leagueId:int}")]
    public async Task<ActionResult<IReadOnlyList<LeaderboardEntryResponse>>> GetLeaderboard(int leagueId, CancellationToken ct)
    {
        var list = await _leaderboardService.GetLeaderboardAsync(leagueId, ct);
        return Ok(list);
    }
}
