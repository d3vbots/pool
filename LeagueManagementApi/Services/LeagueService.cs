using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.Models;
using LeagueManagementApi.DTOs;

namespace LeagueManagementApi.Services;

public interface ILeagueService
{
    Task<LeagueResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<LeagueResponse>> GetAllAsync(CancellationToken ct = default);
    Task<LeagueResponse?> CreateAsync(CreateLeagueRequest req, CancellationToken ct = default);
    Task<LeagueResponse?> UpdateAsync(int id, UpdateLeagueRequest req, CancellationToken ct = default);
    Task<bool> SetStatusAsync(int id, LeagueStatus status, CancellationToken ct = default);
    Task<(bool Ok, string Error)> GenerateFixturesAsync(int leagueId, CancellationToken ct = default);
}

public class LeagueService : ILeagueService
{
    private readonly AppDbContext _db;
    private readonly IRoundRobinService _roundRobin;

    public LeagueService(AppDbContext db, IRoundRobinService roundRobin)
    {
        _db = db;
        _roundRobin = roundRobin;
    }

    public async Task<LeagueResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var league = await _db.Leagues
            .Include(l => l.LeaguePlayers)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, ct);
        return league == null ? null : MapToResponse(league);
    }

    public async Task<IReadOnlyList<LeagueResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _db.Leagues
            .Include(l => l.LeaguePlayers)
            .AsNoTracking()
            .OrderByDescending(l => l.StartDate)
            .ToListAsync(ct);
        return list.Select(MapToResponse).ToList();
    }

    public async Task<LeagueResponse?> CreateAsync(CreateLeagueRequest req, CancellationToken ct = default)
    {
        if (req.StartDate >= req.EndDate)
            return null;
        if (req.MaxPlayers < req.MinPlayers)
            return null;

        var league = new League
        {
            Name = req.Name,
            Description = req.Description,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            MinPlayers = req.MinPlayers,
            MaxPlayers = req.MaxPlayers,
            RegistrationFee = req.RegistrationFee,
            MatchFormatBestOf = req.MatchFormatBestOf,
            IsDoubleRoundRobin = req.IsDoubleRoundRobin,
            WinPoints = req.WinPoints,
            DrawPoints = req.DrawPoints,
            LossPoints = req.LossPoints,
            Status = LeagueStatus.Draft
        };
        _db.Leagues.Add(league);
        await _db.SaveChangesAsync(ct);
        return MapToResponse(league);
    }

    public async Task<LeagueResponse?> UpdateAsync(int id, UpdateLeagueRequest req, CancellationToken ct = default)
    {
        var league = await _db.Leagues.FindAsync(new object[] { id }, ct);
        if (league == null) return null;
        if (league.FixturesGenerated)
            return null; // cannot edit after fixtures generated
        if (req.StartDate >= req.EndDate || req.MaxPlayers < req.MinPlayers)
            return null;

        league.Name = req.Name;
        league.Description = req.Description;
        league.StartDate = req.StartDate;
        league.EndDate = req.EndDate;
        league.MinPlayers = req.MinPlayers;
        league.MaxPlayers = req.MaxPlayers;
        league.RegistrationFee = req.RegistrationFee;
        league.MatchFormatBestOf = req.MatchFormatBestOf;
        league.IsDoubleRoundRobin = req.IsDoubleRoundRobin;
        league.WinPoints = req.WinPoints;
        league.DrawPoints = req.DrawPoints;
        league.LossPoints = req.LossPoints;
        await _db.SaveChangesAsync(ct);
        await _db.Entry(league).ReloadAsync(ct);
        return MapToResponse(league);
    }

    public async Task<bool> SetStatusAsync(int id, LeagueStatus status, CancellationToken ct = default)
    {
        var league = await _db.Leagues.Include(l => l.LeaguePlayers).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (league == null) return false;
        if (status == LeagueStatus.Active && league.LeaguePlayers.Count < league.MinPlayers)
            return false;
        league.Status = status;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<(bool Ok, string Error)> GenerateFixturesAsync(int leagueId, CancellationToken ct = default)
    {
        var league = await _db.Leagues
            .Include(l => l.LeaguePlayers)
            .Include(l => l.Matches)
            .FirstOrDefaultAsync(l => l.Id == leagueId, ct);
        if (league == null)
            return (false, "League not found.");
        if (league.FixturesGenerated || league.Matches.Any())
            return (false, "Fixtures already generated.");
        if (league.Status != LeagueStatus.RegistrationOpen)
            return (false, "League status must be RegistrationOpen to generate fixtures.");
        if (league.LeaguePlayers.Count < league.MinPlayers)
            return (false, $"Need at least {league.MinPlayers} players. Current: {league.LeaguePlayers.Count}.");

        var playerIds = league.LeaguePlayers.Select(lp => lp.PlayerId).ToList();
        var fixtures = _roundRobin.GenerateFixtures(playerIds, league.IsDoubleRoundRobin);

        foreach (var (playerAId, playerBId, leg) in fixtures)
        {
            _db.Matches.Add(new Match
            {
                LeagueId = leagueId,
                PlayerAId = playerAId,
                PlayerBId = playerBId,
                Leg = leg,
                Status = MatchStatus.Pending
            });
        }
        league.FixturesGenerated = true;
        await _db.SaveChangesAsync(ct);
        return (true, string.Empty);
    }

    private static LeagueResponse MapToResponse(League l)
    {
        return new LeagueResponse
        {
            Id = l.Id,
            Name = l.Name,
            Description = l.Description,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            MinPlayers = l.MinPlayers,
            MaxPlayers = l.MaxPlayers,
            RegistrationFee = l.RegistrationFee,
            MatchFormatBestOf = l.MatchFormatBestOf,
            IsDoubleRoundRobin = l.IsDoubleRoundRobin,
            WinPoints = l.WinPoints,
            DrawPoints = l.DrawPoints,
            LossPoints = l.LossPoints,
            Status = l.Status.ToString(),
            FixturesGenerated = l.FixturesGenerated,
            PlayerCount = l.LeaguePlayers?.Count ?? 0
        };
    }
}
