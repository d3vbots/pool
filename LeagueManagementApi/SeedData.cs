using Microsoft.EntityFrameworkCore;
using LeagueManagementApi.Data;
using LeagueManagementApi.Models;

namespace LeagueManagementApi;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db)
    {
        if (await db.Leagues.AnyAsync())
            return;

        var p1 = new Player { Name = "Alex Chen", PhoneNumber = "+1234567890", IsActive = true };
        var p2 = new Player { Name = "Jordan Smith", PhoneNumber = "+1234567891", IsActive = true };
        var p3 = new Player { Name = "Sam Williams", PhoneNumber = "+1234567892", IsActive = true };
        var p4 = new Player { Name = "Casey Brown", PhoneNumber = "+1234567893", IsActive = true };
        var p5 = new Player { Name = "Morgan Davis", PhoneNumber = "+1234567894", IsActive = true };
        var p6 = new Player { Name = "Riley Wilson", PhoneNumber = "+1234567895", IsActive = true };
        var p7 = new Player { Name = "Quinn Taylor", PhoneNumber = "+1234567896", IsActive = true };
        var p8 = new Player { Name = "Jamie Martinez", PhoneNumber = "+1234567897", IsActive = true };
        db.Players.AddRange(p1, p2, p3, p4, p5, p6, p7, p8);
        await db.SaveChangesAsync();

        var league = new League
        {
            Name = "Spring 2025 Pool League",
            Description = "8-ball round robin, best of 4 frames.",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddMonths(2),
            MinPlayers = 4,
            MaxPlayers = 8,
            RegistrationFee = 25.00m,
            MatchFormatBestOf = 4,
            IsDoubleRoundRobin = false,
            WinPoints = 3,
            DrawPoints = 1,
            LossPoints = 0,
            Status = LeagueStatus.RegistrationOpen
        };
        db.Leagues.Add(league);
        await db.SaveChangesAsync();

        foreach (var p in new[] { p1, p2, p3, p4 })
            db.LeaguePlayers.Add(new LeaguePlayer { LeagueId = league.Id, PlayerId = p.Id, PaymentStatus = PaymentStatus.Paid });
        await db.SaveChangesAsync();
    }
}
