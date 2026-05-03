namespace LeagueManagementApi.Models;

public class Match
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public League League { get; set; } = null!;

    public int PlayerAId { get; set; }
    public Player PlayerA { get; set; } = null!;

    public int PlayerBId { get; set; }
    public Player PlayerB { get; set; } = null!;

    public int Leg { get; set; } = 1;
    /// <summary>1-based week within the league span; fixtures are spread evenly across weeks derived from league Start/End dates.</summary>
    public int? WeekNumber { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Pending;

    public int? PlayerAScore { get; set; }
    public int? PlayerBScore { get; set; }

    /// <summary>Green apples (break-and-finish frames) for player A in this match; capped by frames/games they won.</summary>
    public int PlayerAApples { get; set; }
    /// <summary>Green apples for player B in this match.</summary>
    public int PlayerBApples { get; set; }
}
