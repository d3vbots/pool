using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.DTOs;

namespace LeagueManagementApi.Services;

public interface ILeaderboardService
{
    Task<IReadOnlyList<LeaderboardEntryResponse>> GetLeaderboardAsync(int leagueId, CancellationToken ct = default);
}

public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _db;

    public LeaderboardService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LeaderboardEntryResponse>> GetLeaderboardAsync(int leagueId, CancellationToken ct = default)
    {
        var entries = await _db.LeaguePlayers
            .AsNoTracking()
            .Where(lp => lp.LeagueId == leagueId)
            .Include(lp => lp.Player)
            .OrderByDescending(lp => lp.Points)
            .ThenByDescending(lp => lp.GamesWon - lp.GamesLost)
            .ThenByDescending(lp => lp.GamesWon)
            .ThenByDescending(lp => lp.Apples)
            .Select(lp => new LeaderboardEntryResponse
            {
                PlayerId = lp.PlayerId,
                PlayerName = lp.Player.Name,
                Played = lp.Played,
                Wins = lp.Wins,
                Draws = lp.Draws,
                Losses = lp.Losses,
                GamesWon = lp.GamesWon,
                GamesLost = lp.GamesLost,
                GoalDifference = lp.GamesWon - lp.GamesLost,
                Apples = lp.Apples,
                Points = lp.Points
            })
            .ToListAsync(ct);

        int rank = 1;
        foreach (var e in entries)
            e.Rank = rank++;
        return entries;
    }
}
