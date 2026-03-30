using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.Models;
using LeagueManagementApi.DTOs;

namespace LeagueManagementApi.Services;

public interface ILeagueService
{
    Task<LeagueResponse?> GetByIdAsync(int id, bool forPublic = false, CancellationToken ct = default);
    Task<IReadOnlyList<LeagueResponse>> GetAllAsync(bool forPublic = false, string? search = null, CancellationToken ct = default);
    Task<LeagueResponse?> CreateAsync(CreateLeagueRequest req, CancellationToken ct = default);
    Task<LeagueResponse?> UpdateAsync(int id, UpdateLeagueRequest req, CancellationToken ct = default);
    Task<bool> SetStatusAsync(int id, LeagueStatus status, CancellationToken ct = default);
    Task<(bool Ok, string Error)> GenerateFixturesAsync(int leagueId, CancellationToken ct = default);
    Task<(bool Ok, string Error)> RegenerateFixturesAsync(int leagueId, CancellationToken ct = default);
    Task<bool> SoftDeleteAsync(int id, CancellationToken ct = default);
    Task<bool> SetHiddenAsync(int id, bool isHidden, CancellationToken ct = default);
    Task<bool> RestoreAsync(int id, CancellationToken ct = default);
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

    public async Task<LeagueResponse?> GetByIdAsync(int id, bool forPublic = false, CancellationToken ct = default)
    {
        var league = await _db.Leagues
            .Include(l => l.LeaguePlayers)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, ct);
        if (league == null || league.IsDeleted) return null;
        if (forPublic && league.IsHidden) return null;
        return MapToResponse(league);
    }

    public async Task<IReadOnlyList<LeagueResponse>> GetAllAsync(bool forPublic = false, string? search = null, CancellationToken ct = default)
    {
        var query = _db.Leagues
            .Include(l => l.LeaguePlayers)
            .AsNoTracking()
            .Where(l => !l.IsDeleted);
        if (forPublic)
            query = query.Where(l => !l.IsHidden);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(l =>
                EF.Functions.ILike(l.Name, term) ||
                (l.Description != null && EF.Functions.ILike(l.Description, term)));
        }
        var list = await query
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
        if (league == null || league.IsDeleted) return null;

        if (league.FixturesGenerated)
        {
            league.Name = req.Name;
            league.Description = req.Description;
            await _db.SaveChangesAsync(ct);
            return await GetByIdAsync(id, ct: ct);
        }

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
        return await GetByIdAsync(id, ct: ct);
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken ct = default)
    {
        var league = await _db.Leagues.FindAsync(new object[] { id }, ct);
        if (league == null || league.IsDeleted) return false;
        league.IsDeleted = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetHiddenAsync(int id, bool isHidden, CancellationToken ct = default)
    {
        var league = await _db.Leagues.FindAsync(new object[] { id }, ct);
        if (league == null || league.IsDeleted) return false;
        league.IsHidden = isHidden;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RestoreAsync(int id, CancellationToken ct = default)
    {
        var league = await _db.Leagues.FindAsync(new object[] { id }, ct);
        if (league == null || !league.IsDeleted) return false;
        league.IsDeleted = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetStatusAsync(int id, LeagueStatus status, CancellationToken ct = default)
    {
        var league = await _db.Leagues.Include(l => l.LeaguePlayers).FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted, ct);
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
            .FirstOrDefaultAsync(l => l.Id == leagueId && !l.IsDeleted, ct);
        if (league == null)
            return (false, "League not found.");
        if (league.FixturesGenerated || league.Matches.Any())
            return (false, "Fixtures already generated.");
        if (league.Status != LeagueStatus.RegistrationOpen)
            return (false, "League status must be RegistrationOpen to generate fixtures.");
        if (league.LeaguePlayers.Count < league.MinPlayers)
            return (false, $"Need at least {league.MinPlayers} players. Current: {league.LeaguePlayers.Count}.");

        await DoGenerateFixturesAsync(league, leagueId, ct);
        return (true, string.Empty);
    }

    public async Task<(bool Ok, string Error)> RegenerateFixturesAsync(int leagueId, CancellationToken ct = default)
    {
        var league = await _db.Leagues
            .Include(l => l.LeaguePlayers)
            .Include(l => l.Matches)
            .FirstOrDefaultAsync(l => l.Id == leagueId && !l.IsDeleted, ct);
        if (league == null)
            return (false, "League not found.");
        if (!league.FixturesGenerated || !league.Matches.Any())
            return (false, "No fixtures to regenerate. Generate fixtures first.");
        if (league.Status != LeagueStatus.RegistrationOpen && league.Status != LeagueStatus.Active)
            return (false, "Can only regenerate fixtures when league is RegistrationOpen or Active.");
        if (league.LeaguePlayers.Count < league.MinPlayers)
            return (false, $"Need at least {league.MinPlayers} players. Current: {league.LeaguePlayers.Count}.");

        _db.Matches.RemoveRange(league.Matches);
        league.FixturesGenerated = false;
        await _db.SaveChangesAsync(ct);

        await DoGenerateFixturesAsync(league, leagueId, ct);
        return (true, string.Empty);
    }

    /// <summary>
    /// Generates fixtures for a league that has LeaguePlayers loaded and no existing matches. Sets FixturesGenerated = true and saves.
    /// </summary>
    private async Task DoGenerateFixturesAsync(League league, int leagueId, CancellationToken ct)
    {
        var playerIds = league.LeaguePlayers.Select(lp => lp.PlayerId).ToList();
        var fixtures = _roundRobin.GenerateFixtures(playerIds, league.IsDoubleRoundRobin);

        var totalDays = (league.EndDate - league.StartDate).Days;
        var weekCount = totalDays >= 7
            ? Math.Max(1, (int)Math.Ceiling((double)totalDays / 7))
            : 1;

        var assignments = AssignFixturesToWeeksBalanced(fixtures, weekCount);

        foreach (var (playerAId, playerBId, leg, weekNumber) in assignments)
        {
            _db.Matches.Add(new Match
            {
                LeagueId = leagueId,
                PlayerAId = playerAId,
                PlayerBId = playerBId,
                Leg = leg,
                WeekNumber = weekNumber,
                Status = MatchStatus.Pending
            });
        }
        league.FixturesGenerated = true;
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Assigns fixtures to weeks so that: (1) each player has ~50% home/away within each week,
    /// (2) each player gets a similar number of games per week (even spread), and (3) matches are spread evenly across weeks.
    /// </summary>
    private static List<(int PlayerAId, int PlayerBId, int Leg, int WeekNumber)> AssignFixturesToWeeksBalanced(
        IReadOnlyList<(int PlayerAId, int PlayerBId, int Leg)> fixtures,
        int weekCount)
    {
        if (weekCount <= 0) weekCount = 1;
        var result = new List<(int, int, int, int)>(fixtures.Count);

        // Per week: match count and per-player (asA, asB) for home/away balance
        var weekMatchCount = new int[weekCount];
        var weekPlayerBalance = new Dictionary<int, (int asA, int asB)>[weekCount];
        for (var w = 0; w < weekCount; w++)
            weekPlayerBalance[w] = new Dictionary<int, (int, int)>();

        var maxMatchesPerWeek = (int)Math.Ceiling((double)fixtures.Count / weekCount);

        foreach (var (playerAId, playerBId, leg) in fixtures)
        {
            int bestWeek = 0;
            long bestCost = long.MaxValue;

            for (var w = 0; w < weekCount; w++)
            {
                if (weekMatchCount[w] >= maxMatchesPerWeek) continue;

                var balance = weekPlayerBalance[w];
                int asA = balance.GetValueOrDefault(playerAId, (0, 0)).Item1;
                int asB = balance.GetValueOrDefault(playerAId, (0, 0)).Item2;
                int asA2 = balance.GetValueOrDefault(playerBId, (0, 0)).Item1;
                int asB2 = balance.GetValueOrDefault(playerBId, (0, 0)).Item2;

                // 1) Home/away balance in this week (prefer ~50% each)
                int imbA = Math.Abs((asA + 1) - asB);
                int imbB = Math.Abs(asA2 - (asB2 + 1));
                int balanceCost = imbA + imbB;

                // 2) Games-per-player in this week: prefer weeks where both have fewer games (even spread across weeks)
                int gamesAInWeek = asA + asB;
                int gamesBInWeek = asA2 + asB2;
                int loadCost = (gamesAInWeek + 1) + (gamesBInWeek + 1);

                // 3) Prefer weeks with fewer matches so far (spread matches evenly across weeks)
                int weekLoadCost = weekMatchCount[w];

                // Priority: balance > per-player even games > even matches per week
                long cost = balanceCost * 10000L + loadCost * 100L + weekLoadCost;

                if (cost < bestCost)
                {
                    bestCost = cost;
                    bestWeek = w;
                }
            }

            var weekIndex = bestWeek;
            weekMatchCount[weekIndex]++;
            UpdateBalance(weekPlayerBalance[weekIndex], playerAId, playerBId, isA: true);
            result.Add((playerAId, playerBId, leg, weekIndex + 1));
        }

        return result;
    }

    private static void UpdateBalance(Dictionary<int, (int asA, int asB)> balance, int playerAId, int playerBId, bool isA)
    {
        if (isA)
        {
            var a = balance.GetValueOrDefault(playerAId, (0, 0));
            balance[playerAId] = (a.Item1 + 1, a.Item2);
            var b = balance.GetValueOrDefault(playerBId, (0, 0));
            balance[playerBId] = (b.Item1, b.Item2 + 1);
        }
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
            PlayerCount = l.LeaguePlayers?.Count ?? 0,
            IsDeleted = l.IsDeleted,
            IsHidden = l.IsHidden
        };
    }
}
