namespace LeagueManagementApi.Models;

public class LeaguePlayer
{
    public int LeagueId { get; set; }
    public League League { get; set; } = null!;

    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.NotPaid;
    public int Played { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GamesWon { get; set; }
    public int GamesLost { get; set; }
    public int GoalDifference => GamesWon - GamesLost;
    public int Points { get; set; }
}
