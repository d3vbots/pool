namespace LeagueManagementApi.Models;

public enum MatchStatus
{
    Pending = 0,
    Completed = 1,
    /// <summary>Neither player played by cutoff; both get a loss and forfeit games (MatchFormatBestOf) on stats.</summary>
    Abandoned = 2
}
