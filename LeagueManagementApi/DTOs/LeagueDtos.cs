namespace LeagueManagementApi.DTOs;

public class CreateLeagueRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public decimal RegistrationFee { get; set; }
    public int MatchFormatBestOf { get; set; } = 4;
    public bool IsDoubleRoundRobin { get; set; }
    public int WinPoints { get; set; } = 3;
    public int DrawPoints { get; set; } = 1;
    public int LossPoints { get; set; } = 0;
}

public class UpdateLeagueRequest : CreateLeagueRequest { }

public class LeagueResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public decimal RegistrationFee { get; set; }
    public int MatchFormatBestOf { get; set; }
    public bool IsDoubleRoundRobin { get; set; }
    public int WinPoints { get; set; }
    public int DrawPoints { get; set; }
    public int LossPoints { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool FixturesGenerated { get; set; }
    public int PlayerCount { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHidden { get; set; }
}
