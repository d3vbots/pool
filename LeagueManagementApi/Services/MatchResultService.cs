using LeagueManagementApi.Models;

namespace LeagueManagementApi.Services;

public interface IMatchResultService
{
    (int pointsA, int pointsB, bool isDraw) GetMatchOutcome(int playerAScore, int playerBScore, int winPoints, int drawPoints, int lossPoints);
}

public class MatchResultService : IMatchResultService
{
    public (int pointsA, int pointsB, bool isDraw) GetMatchOutcome(int playerAScore, int playerBScore, int winPoints, int drawPoints, int lossPoints)
    {
        if (playerAScore > playerBScore)
            return (winPoints, lossPoints, false);
        if (playerBScore > playerAScore)
            return (lossPoints, winPoints, false);
        return (drawPoints, drawPoints, true);
    }
}
