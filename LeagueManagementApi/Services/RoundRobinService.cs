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

        // If odd number, add a "bye" (use -1 or skip; we require even for standard round robin - duplicate first player as bye)
        if (list.Count % 2 != 0)
            list.Add(list[0]); // bye: match with self will be skipped

        int n = list.Count;
        int rounds = n - 1;
        int matchesPerRound = n / 2;

        for (int round = 0; round < rounds; round++)
        {
            for (int m = 0; m < matchesPerRound; m++)
            {
                int idA = list[m];
                int idB = list[n - 1 - m];
                if (idA == idB) continue; // bye
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
