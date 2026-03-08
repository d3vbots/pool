using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using LeagueManagementApi.Models;

namespace LeagueManagementApi.Data;

public class AppDbContext : DbContext
{
    /// <summary>Converts Unspecified DateTime to UTC so Npgsql accepts it for timestamp with time zone.</summary>
    private static readonly ValueConverter<DateTime, DateTime> UtcConverter =
        new(v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(), v => v);

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<League> Leagues => Set<League>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<LeaguePlayer> LeaguePlayers => Set<LeaguePlayer>();
    public DbSet<Match> Matches => Set<Match>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<LeaguePlayer>(e =>
        {
            e.HasKey(lp => new { lp.LeagueId, lp.PlayerId });
            e.HasOne(lp => lp.League).WithMany(l => l.LeaguePlayers).HasForeignKey(lp => lp.LeagueId);
            e.HasOne(lp => lp.Player).WithMany(p => p.LeaguePlayers).HasForeignKey(lp => lp.PlayerId);
            e.Ignore(lp => lp.GoalDifference);
        });

        builder.Entity<Match>(e =>
        {
            e.HasOne(m => m.League).WithMany(l => l.Matches).HasForeignKey(m => m.LeagueId);
            e.HasOne(m => m.PlayerA).WithMany(p => p.MatchesAsPlayerA).HasForeignKey(m => m.PlayerAId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.PlayerB).WithMany(p => p.MatchesAsPlayerB).HasForeignKey(m => m.PlayerBId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<League>(e =>
        {
            e.HasIndex(l => l.Status);
            e.Property(l => l.RegistrationFee).HasPrecision(18, 2);
            e.Property(l => l.StartDate).HasConversion(UtcConverter);
            e.Property(l => l.EndDate).HasConversion(UtcConverter);
        });
        builder.Entity<Match>().HasIndex(m => new { m.LeagueId, m.Status });
        builder.Entity<LeaguePlayer>().HasIndex(lp => lp.LeagueId);
    }
}
