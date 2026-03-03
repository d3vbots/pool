namespace LeagueManagementApi.DTOs;

public class LeaderboardEntryResponse
{
    public int Rank { get; set; }
    public int PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public int Played { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GamesWon { get; set; }
    public int GamesLost { get; set; }
    public int GoalDifference { get; set; }
    public int Points { get; set; }
}
