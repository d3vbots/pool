namespace LeagueManagementApi.DTOs;

public class MatchResponse
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    /// <summary>Set when returning matches for a player (to show which league each match belongs to).</summary>
    public string? LeagueName { get; set; }
    public int PlayerAId { get; set; }
    public string PlayerAName { get; set; } = string.Empty;
    public int PlayerBId { get; set; }
    public string PlayerBName { get; set; } = string.Empty;
    public int Leg { get; set; }
    /// <summary>1-based week in the league span; null for leagues created before week-based scheduling.</summary>
    public int? WeekNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? PlayerAScore { get; set; }
    public int? PlayerBScore { get; set; }
}

public class SetMatchResultRequest
{
    public int PlayerAScore { get; set; }
    public int PlayerBScore { get; set; }
}
