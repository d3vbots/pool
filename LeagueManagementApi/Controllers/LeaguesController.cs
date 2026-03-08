using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeagueManagementApi.DTOs;
using LeagueManagementApi.Models;
using LeagueManagementApi.Services;

namespace LeagueManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaguesController : ControllerBase
{
    private readonly ILeagueService _leagueService;

    public LeaguesController(ILeagueService leagueService) => _leagueService = leagueService;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LeagueResponse>>> GetLeagues([FromQuery] bool @public = false, [FromQuery] string? q = null, CancellationToken ct = default)
    {
        var list = await _leagueService.GetAllAsync(forPublic: @public, search: q, ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeagueResponse>> GetLeague(int id, [FromQuery] bool @public = false, CancellationToken ct = default)
    {
        var league = await _leagueService.GetByIdAsync(id, forPublic: @public, ct);
        if (league == null) return NotFound();
        return Ok(league);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<LeagueResponse>> CreateLeague([FromBody] CreateLeagueRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Name is required.");
        var league = await _leagueService.CreateAsync(req, ct);
        if (league == null) return BadRequest("Invalid dates or min/max players.");
        return CreatedAtAction(nameof(GetLeague), new { id = league.Id }, league);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<LeagueResponse>> UpdateLeague(int id, [FromBody] UpdateLeagueRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Name is required.");
        var league = await _leagueService.UpdateAsync(id, req, ct);
        if (league == null) return BadRequest("League not found, or fixtures already generated, or invalid data.");
        return Ok(league);
    }

    [HttpPut("{id:int}/status")]
    [Authorize]
    public async Task<ActionResult> SetStatus(int id, [FromBody] SetStatusRequest body, CancellationToken ct)
    {
        if (!Enum.TryParse<LeagueStatus>(body.Status, true, out var status))
            return BadRequest("Invalid status.");
        var ok = await _leagueService.SetStatusAsync(id, status, ct);
        if (!ok) return BadRequest("League not found or cannot transition (e.g. Active requires MinPlayers).");
        return NoContent();
    }

    [HttpPost("{id:int}/generate-fixtures")]
    [Authorize]
    public async Task<ActionResult> GenerateFixtures(int id, CancellationToken ct)
    {
        var (ok, error) = await _leagueService.GenerateFixturesAsync(id, ct);
        if (!ok) return BadRequest(error);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<ActionResult> SoftDeleteLeague(int id, CancellationToken ct)
    {
        var ok = await _leagueService.SoftDeleteAsync(id, ct);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPut("{id:int}/hidden")]
    [Authorize]
    public async Task<ActionResult> SetLeagueHidden(int id, [FromBody] SetHiddenRequest body, CancellationToken ct)
    {
        var ok = await _leagueService.SetHiddenAsync(id, body.IsHidden, ct);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<ActionResult> RestoreLeague(int id, CancellationToken ct)
    {
        var ok = await _leagueService.RestoreAsync(id, ct);
        if (!ok) return NotFound();
        return NoContent();
    }
}

public class SetHiddenRequest
{
    public bool IsHidden { get; set; }
}

public class SetStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
