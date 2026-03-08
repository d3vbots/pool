using LeagueManagementApi.Models;

namespace LeagueManagementApi.Services;

public interface IRoundRobinService
{
    IReadOnlyList<(int PlayerAId, int PlayerBId, int Leg)> GenerateFixtures(IReadOnlyList<int> playerIds, bool isDoubleRoundRobin);
}

public class RoundRobinService : IRoundRobinService
{
    /// <summary>
    /// Generate round-robin fixture pairs. For single round: n(n-1)/2 matches. For double: n(n-1) matches (each pair twice, home/away).
    /// Uses circle method: fix one player, rotate others.
    /// </summary>
    public IReadOnlyList<(int PlayerAId, int PlayerBId, int Leg)> GenerateFixtures(IReadOnlyList<int> playerIds, bool isDoubleRoundRobin)
    {
        if (playerIds == null || playerIds.Count < 2)
            return Array.Empty<(int, int, int)>();

        var list = playerIds.ToList();
        var fixtures = new List<(int PlayerAId, int PlayerBId, int Leg)>();

        // If odd number, add a bye slot (sentinel -1). Never duplicate a real player or they get double the games.
        const int byeId = -1;
        if (list.Count % 2 != 0)
            list.Add(byeId);

        int n = list.Count;
        int rounds = n - 1;
        int matchesPerRound = n / 2;

        for (int round = 0; round < rounds; round++)
        {
            for (int m = 0; m < matchesPerRound; m++)
            {
                int idA = list[m];
                int idB = list[n - 1 - m];
                if (idA == byeId || idB == byeId) continue; // skip: one player has a bye this round
                fixtures.Add((idA, idB, 1));
            }
            // Circle method: fix first, rotate rest clockwise (last moves to second)
            var rotated = new List<int> { list[0], list[n - 1] };
            for (int i = 1; i < n - 1; i++)
                rotated.Add(list[i]);
            list = rotated;
        }

        if (isDoubleRoundRobin)
        {
            var secondLeg = new List<(int, int, int)>();
            foreach (var (playerAId, playerBId, _) in fixtures)
                secondLeg.Add((playerBId, playerAId, 2)); // reverse home/away
            fixtures.AddRange(secondLeg);
        }

        return fixtures;
    }
}
