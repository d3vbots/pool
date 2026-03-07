using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeagueManagementApi.DTOs;
using LeagueManagementApi.Services;

namespace LeagueManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchesController(IMatchService matchService) => _matchService = matchService;

    [HttpGet("leagues/{leagueId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<MatchResponse>>> GetLeagueMatches(int leagueId, CancellationToken ct)
    {
        var list = await _matchService.GetByLeagueAsync(leagueId, ct);
        return Ok(list);
    }

    [HttpPut("{id:int}/result")]
    [Authorize]
    public async Task<ActionResult> SetResult(int id, [FromBody] SetMatchResultRequest req, CancellationToken ct)
    {
        var (ok, error) = await _matchService.SetResultAsync(id, req, ct);
        if (!ok) return BadRequest(error);
        return NoContent();
    }

    [HttpDelete("{id:int}/result")]
    [Authorize]
    public async Task<ActionResult> DeleteResult(int id, CancellationToken ct)
    {
        var (ok, error) = await _matchService.DeleteResultAsync(id, ct);
        if (!ok) return BadRequest(error);
        return NoContent();
    }
}
