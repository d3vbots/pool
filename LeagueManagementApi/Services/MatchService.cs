using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.Models;
using LeagueManagementApi.DTOs;

namespace LeagueManagementApi.Services;

public interface IMatchService
{
    Task<IReadOnlyList<MatchResponse>> GetByLeagueAsync(int leagueId, CancellationToken ct = default);
    Task<IReadOnlyList<MatchResponse>> GetByPlayerAsync(int playerId, int? leagueId, CancellationToken ct = default);
    Task<(bool Ok, string Error)> SetResultAsync(int matchId, SetMatchResultRequest req, CancellationToken ct = default);
    Task<(bool Ok, string Error)> DeleteResultAsync(int matchId, CancellationToken ct = default);
}

public class MatchService : IMatchService
{
    private readonly AppDbContext _db;
    private readonly IMatchResultService _resultService;

    public MatchService(AppDbContext db, IMatchResultService resultService)
    {
        _db = db;
        _resultService = resultService;
    }

    public async Task<IReadOnlyList<MatchResponse>> GetByLeagueAsync(int leagueId, CancellationToken ct = default)
    {
        var matches = await _db.Matches
            .AsNoTracking()
            .Where(m => m.LeagueId == leagueId)
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .OrderBy(m => m.WeekNumber ?? int.MaxValue)
            .ThenBy(m => m.Leg)
            .ThenBy(m => m.Id)
            .ToListAsync(ct);
        return matches.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<MatchResponse>> GetByPlayerAsync(int playerId, int? leagueId, CancellationToken ct = default)
    {
        var query = _db.Matches
            .AsNoTracking()
            .Where(m => m.PlayerAId == playerId || m.PlayerBId == playerId);
        if (leagueId.HasValue)
            query = query.Where(m => m.LeagueId == leagueId.Value);
        var matches = await query
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .Include(m => m.League)
            .OrderBy(m => m.LeagueId)
            .ThenBy(m => m.WeekNumber ?? int.MaxValue)
            .ThenBy(m => m.Leg)
            .ThenBy(m => m.Id)
            .ToListAsync(ct);
        return matches.Select(Map).ToList();
    }

    public async Task<(bool Ok, string Error)> SetResultAsync(int matchId, SetMatchResultRequest req, CancellationToken ct = default)
    {
        var match = await _db.Matches
            .Include(m => m.League)
            .Include(m => m.PlayerA)
            .Include(m => m.PlayerB)
            .FirstOrDefaultAsync(m => m.Id == matchId, ct);
        if (match == null)
            return (false, "Match not found.");

        int bestOf = match.League.MatchFormatBestOf;
        if (req.PlayerAScore < 0 || req.PlayerBScore < 0 ||
            req.PlayerAScore + req.PlayerBScore > bestOf)
            return (false, $"Scores must be non-negative and total games must not exceed {bestOf}.");

        // Valid outcomes for BestOf: one player wins (has more games) or draw (equal). e.g. Best of 4: 4-0, 3-1, 2-2
        bool aWins = req.PlayerAScore > req.PlayerBScore;
        bool bWins = req.PlayerBScore > req.PlayerAScore;
        bool isDraw = req.PlayerAScore == req.PlayerBScore;
        if (!aWins && !bWins && !isDraw)
            return (false, "Invalid score combination.");

        var lpA = await _db.LeaguePlayers.FirstOrDefaultAsync(
            lp => lp.LeagueId == match.LeagueId && lp.PlayerId == match.PlayerAId, ct);
        var lpB = await _db.LeaguePlayers.FirstOrDefaultAsync(
            lp => lp.LeagueId == match.LeagueId && lp.PlayerId == match.PlayerBId, ct);
        if (lpA == null || lpB == null)
            return (false, "League player record not found.");

        // If match already had a result, revert it first
        if (match.Status == MatchStatus.Completed && match.PlayerAScore.HasValue && match.PlayerBScore.HasValue)
            RevertResult(match, lpA, lpB);

        var (pointsA, pointsB, _) = _resultService.GetMatchOutcome(
            req.PlayerAScore, req.PlayerBScore,
            match.League.WinPoints, match.League.DrawPoints, match.League.LossPoints);

        match.PlayerAScore = req.PlayerAScore;
        match.PlayerBScore = req.PlayerBScore;
        match.Status = MatchStatus.Completed;

        lpA.Played++;
        lpA.GamesWon += req.PlayerAScore;
        lpA.GamesLost += req.PlayerBScore;
        lpA.Points += pointsA;
        if (aWins) lpA.Wins++;
        else if (bWins) lpA.Losses++;
        else lpA.Draws++;

        lpB.Played++;
        lpB.GamesWon += req.PlayerBScore;
        lpB.GamesLost += req.PlayerAScore;
        lpB.Points += pointsB;
        if (bWins) lpB.Wins++;
        else if (aWins) lpB.Losses++;
        else lpB.Draws++;

        await _db.SaveChangesAsync(ct);
        return (true, string.Empty);
    }

    public async Task<(bool Ok, string Error)> DeleteResultAsync(int matchId, CancellationToken ct = default)
    {
        var match = await _db.Matches
            .Include(m => m.League)
            .FirstOrDefaultAsync(m => m.Id == matchId, ct);
        if (match == null)
            return (false, "Match not found.");
        if (match.Status != MatchStatus.Completed || !match.PlayerAScore.HasValue)
            return (false, "Match has no result to delete.");

        var lpA = await _db.LeaguePlayers.FirstOrDefaultAsync(
            lp => lp.LeagueId == match.LeagueId && lp.PlayerId == match.PlayerAId, ct);
        var lpB = await _db.LeaguePlayers.FirstOrDefaultAsync(
            lp => lp.LeagueId == match.LeagueId && lp.PlayerId == match.PlayerBId, ct);
        if (lpA == null || lpB == null)
            return (false, "League player record not found.");

        RevertResult(match, lpA, lpB);
        match.PlayerAScore = null;
        match.PlayerBScore = null;
        match.Status = MatchStatus.Pending;
        await _db.SaveChangesAsync(ct);
        return (true, string.Empty);
    }

    private void RevertResult(Match match, LeaguePlayer lpA, LeaguePlayer lpB)
    {
        int sa = match.PlayerAScore ?? 0;
        int sb = match.PlayerBScore ?? 0;
        var (pointsA, pointsB, _) = _resultService.GetMatchOutcome(sa, sb,
            match.League.WinPoints, match.League.DrawPoints, match.League.LossPoints);

        lpA.Played--;
        lpA.GamesWon -= sa;
        lpA.GamesLost -= sb;
        lpA.Points -= pointsA;
        if (pointsA > match.League.LossPoints) lpA.Wins--;
        else if (pointsB > match.League.LossPoints) lpA.Losses--;
        else lpA.Draws--;

        lpB.Played--;
        lpB.GamesWon -= sb;
        lpB.GamesLost -= sa;
        lpB.Points -= pointsB;
        if (pointsB > match.League.LossPoints) lpB.Wins--;
        else if (pointsA > match.League.LossPoints) lpB.Losses--;
        else lpB.Draws--;
    }

    private static MatchResponse Map(Match m) => new()
    {
        Id = m.Id,
        LeagueId = m.LeagueId,
        LeagueName = m.League?.Name,
        PlayerAId = m.PlayerAId,
        PlayerAName = m.PlayerA?.Name ?? "",
        PlayerBId = m.PlayerBId,
        PlayerBName = m.PlayerB?.Name ?? "",
        Leg = m.Leg,
        WeekNumber = m.WeekNumber,
        Status = m.Status.ToString(),
        PlayerAScore = m.PlayerAScore,
        PlayerBScore = m.PlayerBScore
    };
}
