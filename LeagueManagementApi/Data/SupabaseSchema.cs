using Microsoft.EntityFrameworkCore;

namespace LeagueManagementApi.Data;

/// <summary>
/// Ensures our app tables exist on Supabase. Use this instead of EnsureCreatedAsync
/// when the database already has other tables (e.g. Supabase auth/storage).
/// </summary>
public static class SupabaseSchema
{
    public static async Task EnsureLeagueManagementSchemaAsync(this AppDbContext db, CancellationToken ct = default)
    {
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Players"" (
                ""Id"" serial PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""PhoneNumber"" text NOT NULL,
                ""ProfileImageUrl"" text,
                ""IsActive"" boolean NOT NULL DEFAULT true
            );", ct);

        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Leagues"" (
                ""Id"" serial PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""Description"" text,
                ""StartDate"" timestamp with time zone NOT NULL,
                ""EndDate"" timestamp with time zone NOT NULL,
                ""MinPlayers"" integer NOT NULL,
                ""MaxPlayers"" integer NOT NULL,
                ""RegistrationFee"" numeric(18,2) NOT NULL,
                ""MatchFormatBestOf"" integer NOT NULL DEFAULT 4,
                ""IsDoubleRoundRobin"" boolean NOT NULL DEFAULT false,
                ""WinPoints"" integer NOT NULL DEFAULT 3,
                ""DrawPoints"" integer NOT NULL DEFAULT 1,
                ""LossPoints"" integer NOT NULL DEFAULT 0,
                ""Status"" integer NOT NULL DEFAULT 0,
                ""FixturesGenerated"" boolean NOT NULL DEFAULT false,
                ""IsDeleted"" boolean NOT NULL DEFAULT false,
                ""IsHidden"" boolean NOT NULL DEFAULT false
            )", ct);
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Leagues_Status"" ON ""Leagues"" (""Status"")", ct);
        await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Leagues"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT false", ct);
        await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Leagues"" ADD COLUMN IF NOT EXISTS ""IsHidden"" boolean NOT NULL DEFAULT false", ct);

        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""LeaguePlayers"" (
                ""LeagueId"" integer NOT NULL,
                ""PlayerId"" integer NOT NULL,
                ""PaymentStatus"" integer NOT NULL DEFAULT 0,
                ""Played"" integer NOT NULL DEFAULT 0,
                ""Wins"" integer NOT NULL DEFAULT 0,
                ""Draws"" integer NOT NULL DEFAULT 0,
                ""Losses"" integer NOT NULL DEFAULT 0,
                ""GamesWon"" integer NOT NULL DEFAULT 0,
                ""GamesLost"" integer NOT NULL DEFAULT 0,
                ""Points"" integer NOT NULL DEFAULT 0,
                PRIMARY KEY (""LeagueId"", ""PlayerId""),
                CONSTRAINT ""FK_LeaguePlayers_Leagues"" FOREIGN KEY (""LeagueId"") REFERENCES ""Leagues"" (""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_LeaguePlayers_Players"" FOREIGN KEY (""PlayerId"") REFERENCES ""Players"" (""Id"") ON DELETE CASCADE
            )", ct);
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_LeaguePlayers_LeagueId"" ON ""LeaguePlayers"" (""LeagueId"")", ct);

        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Matches"" (
                ""Id"" serial PRIMARY KEY,
                ""LeagueId"" integer NOT NULL,
                ""PlayerAId"" integer NOT NULL,
                ""PlayerBId"" integer NOT NULL,
                ""Leg"" integer NOT NULL DEFAULT 1,
                ""WeekNumber"" integer,
                ""Status"" integer NOT NULL DEFAULT 0,
                ""PlayerAScore"" integer,
                ""PlayerBScore"" integer,
                CONSTRAINT ""FK_Matches_Leagues"" FOREIGN KEY (""LeagueId"") REFERENCES ""Leagues"" (""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_Matches_PlayerA"" FOREIGN KEY (""PlayerAId"") REFERENCES ""Players"" (""Id"") ON DELETE RESTRICT,
                CONSTRAINT ""FK_Matches_PlayerB"" FOREIGN KEY (""PlayerBId"") REFERENCES ""Players"" (""Id"") ON DELETE RESTRICT
            )", ct);
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Matches_LeagueId_Status"" ON ""Matches"" (""LeagueId"", ""Status"")", ct);
    }
}
