using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.DTOs;
using LeagueManagementApi.Models;
using LeagueManagementApi.Services;

namespace LeagueManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlayersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMatchService _matchService;

    public PlayersController(AppDbContext db, IMatchService matchService)
    {
        _db = db;
        _matchService = matchService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlayerResponse>>> GetPlayers([FromQuery] string? q = null, CancellationToken ct = default)
    {
        var query = _db.Players
            .AsNoTracking()
            .Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = $"%{q.Trim()}%";
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, term) ||
                EF.Functions.ILike(p.PhoneNumber, term));
        }
        var list = await query
            .OrderBy(p => p.Name)
            .Select(p => new PlayerResponse
            {
                Id = p.Id,
                Name = p.Name,
                PhoneNumber = p.PhoneNumber,
                ProfileImageUrl = p.ProfileImageUrl,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<PlayerResponse>> GetPlayer(int id, CancellationToken ct)
    {
        var player = await _db.Players
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (player == null || !player.IsActive)
            return NotFound("Player not found.");
        return Ok(new PlayerResponse
        {
            Id = player.Id,
            Name = player.Name,
            PhoneNumber = player.PhoneNumber,
            ProfileImageUrl = player.ProfileImageUrl,
            IsActive = player.IsActive
        });
    }

    [HttpGet("{id:int}/leagues")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<PlayerLeagueEntryResponse>>> GetPlayerLeagues(int id, CancellationToken ct)
    {
        var list = await _db.LeaguePlayers
            .AsNoTracking()
            .Where(lp => lp.PlayerId == id)
            .Include(lp => lp.League)
            .OrderByDescending(lp => lp.League!.StartDate)
            .Select(lp => new PlayerLeagueEntryResponse
            {
                LeagueId = lp.LeagueId,
                LeagueName = lp.League!.Name,
                LeagueStatus = lp.League.Status.ToString(),
                PaymentStatus = lp.PaymentStatus.ToString(),
                Played = lp.Played,
                Wins = lp.Wins,
                Draws = lp.Draws,
                Losses = lp.Losses,
                GamesWon = lp.GamesWon,
                GamesLost = lp.GamesLost,
                GoalDifference = lp.GamesWon - lp.GamesLost,
                Points = lp.Points
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}/matches")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<MatchResponse>>> GetPlayerMatches(int id, [FromQuery] int? leagueId, CancellationToken ct)
    {
        var list = await _matchService.GetByPlayerAsync(id, leagueId, ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<PlayerResponse>> CreatePlayer([FromBody] CreatePlayerRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Name is required.");
        var player = new Player
        {
            Name = req.Name.Trim(),
            PhoneNumber = req.PhoneNumber?.Trim() ?? "",
            ProfileImageUrl = req.ProfileImageUrl?.Trim(),
            IsActive = true
        };
        _db.Players.Add(player);
        await _db.SaveChangesAsync(ct);
        var response = new PlayerResponse
        {
            Id = player.Id,
            Name = player.Name,
            PhoneNumber = player.PhoneNumber,
            ProfileImageUrl = player.ProfileImageUrl,
            IsActive = player.IsActive
        };
        return Created($"/api/players/{player.Id}", response);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> RemovePlayer(int id, CancellationToken ct)
    {
        var player = await _db.Players.FindAsync(new object[] { id }, ct);
        if (player == null) return NotFound("Player not found.");
        player.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("leagues/{leagueId:int}")]
    public async Task<ActionResult<IReadOnlyList<LeaguePlayerResponse>>> GetLeaguePlayers(int leagueId, CancellationToken ct)
    {
        var list = await _db.LeaguePlayers
            .AsNoTracking()
            .Where(lp => lp.LeagueId == leagueId)
            .Include(lp => lp.Player)
            .OrderByDescending(lp => lp.Points)
            .ThenByDescending(lp => lp.GamesWon - lp.GamesLost)
            .Select(lp => new LeaguePlayerResponse
            {
                LeagueId = lp.LeagueId,
                PlayerId = lp.PlayerId,
                PlayerName = lp.Player.Name,
                PaymentStatus = lp.PaymentStatus.ToString(),
                Played = lp.Played,
                Wins = lp.Wins,
                Draws = lp.Draws,
                Losses = lp.Losses,
                GamesWon = lp.GamesWon,
                GamesLost = lp.GamesLost,
                GoalDifference = lp.GamesWon - lp.GamesLost,
                Points = lp.Points
            })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("leagues/{leagueId:int}")]
    public async Task<ActionResult> AddPlayerToLeague(int leagueId, [FromBody] AddPlayerToLeagueRequest body, CancellationToken ct)
    {
        var league = await _db.Leagues.FindAsync(new object[] { leagueId }, ct);
        if (league == null) return NotFound("League not found.");
        if (league.Status != LeagueStatus.RegistrationOpen && league.Status != LeagueStatus.Draft)
            return BadRequest("Registration is closed for this league.");
        var player = await _db.Players.FindAsync(new object[] { body.PlayerId }, ct);
        if (player == null) return NotFound("Player not found.");
        var exists = await _db.LeaguePlayers.AnyAsync(lp => lp.LeagueId == leagueId && lp.PlayerId == body.PlayerId, ct);
        if (exists) return BadRequest("Player is already in this league.");
        if (league.LeaguePlayers == null)
            await _db.Entry(league).Collection(l => l.LeaguePlayers).LoadAsync(ct);
        var count = league.LeaguePlayers?.Count ?? await _db.LeaguePlayers.CountAsync(lp => lp.LeagueId == leagueId, ct);
        if (count >= league.MaxPlayers)
            return BadRequest("League has reached maximum players.");

        _db.LeaguePlayers.Add(new LeaguePlayer
        {
            LeagueId = leagueId,
            PlayerId = body.PlayerId,
            PaymentStatus = PaymentStatus.NotPaid
        });
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPut("leagues/{leagueId:int}/{playerId:int}/payment")]
    public async Task<ActionResult> UpdateLeaguePlayerPayment(int leagueId, int playerId, [FromBody] UpdatePaymentRequest body, CancellationToken ct)
    {
        if (!Enum.TryParse<PaymentStatus>(body.PaymentStatus, true, out var status))
            return BadRequest("PaymentStatus must be Paid or NotPaid.");
        var lp = await _db.LeaguePlayers.FirstOrDefaultAsync(lp => lp.LeagueId == leagueId && lp.PlayerId == playerId, ct);
        if (lp == null) return NotFound("Player is not in this league.");
        lp.PaymentStatus = status;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("leagues/{leagueId:int}/{playerId:int}")]
    public async Task<ActionResult> RemovePlayerFromLeague(int leagueId, int playerId, CancellationToken ct)
    {
        var league = await _db.Leagues.FindAsync(new object[] { leagueId }, ct);
        if (league == null) return NotFound("League not found.");
        if (league.FixturesGenerated)
            return BadRequest("Cannot remove players after fixtures are generated.");
        var lp = await _db.LeaguePlayers.FirstOrDefaultAsync(lp => lp.LeagueId == leagueId && lp.PlayerId == playerId, ct);
        if (lp == null) return NotFound("Player is not in this league.");
        _db.LeaguePlayers.Remove(lp);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public class AddPlayerToLeagueRequest
{
    public int PlayerId { get; set; }
}

public class UpdatePaymentRequest
{
    public string PaymentStatus { get; set; } = string.Empty;
}
