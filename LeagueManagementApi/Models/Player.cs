namespace LeagueManagementApi.Models;

public class Player
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<LeaguePlayer> LeaguePlayers { get; set; } = new List<LeaguePlayer>();
    public ICollection<Match> MatchesAsPlayerA { get; set; } = new List<Match>();
    public ICollection<Match> MatchesAsPlayerB { get; set; } = new List<Match>();
}
