namespace LeagueManagementApi.DTOs;

public class CreatePlayerRequest
{
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
}

public class PlayerResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; }
}

public class LeaguePlayerResponse
{
    public int LeagueId { get; set; }
    public int PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public int Played { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int GamesWon { get; set; }
    public int GamesLost { get; set; }
    public int GoalDifference { get; set; }
    public int Points { get; set; }
}
