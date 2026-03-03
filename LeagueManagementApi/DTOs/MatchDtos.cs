namespace LeagueManagementApi.DTOs;

public class MatchResponse
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public int PlayerAId { get; set; }
    public string PlayerAName { get; set; } = string.Empty;
    public int PlayerBId { get; set; }
    public string PlayerBName { get; set; } = string.Empty;
    public int Leg { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? PlayerAScore { get; set; }
    public int? PlayerBScore { get; set; }
}

public class SetMatchResultRequest
{
    public int PlayerAScore { get; set; }
    public int PlayerBScore { get; set; }
}
