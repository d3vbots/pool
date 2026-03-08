namespace LeagueManagementApi.Models;

public class League
{
    public int Id { get; set; }
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
    public LeagueStatus Status { get; set; } = LeagueStatus.Draft;
    public bool FixturesGenerated { get; set; }
    /// <summary>When true, league is excluded from all lists and GetById returns 404 (soft delete).</summary>
    public bool IsDeleted { get; set; }
    /// <summary>When true, league is hidden from public listings (e.g. standings) but still visible to admins.</summary>
    public bool IsHidden { get; set; }

    public ICollection<LeaguePlayer> LeaguePlayers { get; set; } = new List<LeaguePlayer>();
    public ICollection<Match> Matches { get; set; } = new List<Match>();
}
