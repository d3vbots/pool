using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LeagueManagementApi.Data;
using LeagueManagementApi.Services;
using LeagueManagementApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var conn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=league.db";
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(conn));

builder.Services.AddScoped<IRoundRobinService, RoundRobinService>();
builder.Services.AddScoped<IMatchResultService, MatchResultService>();
builder.Services.AddScoped<ILeagueService, LeagueService>();
builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();
builder.Services.AddScoped<IMatchService, MatchService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "LeagueManagementSecretKeyThatIsAtLeast32CharactersLong!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LeagueManagementApi",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LeagueManagementApp",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors(policy =>
{
    policy.AllowAnyOrigin();
    policy.AllowAnyMethod();
    policy.AllowAnyHeader();
});

if (app.Environment.IsDevelopment())
    app.UseSwagger().UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    // Add WeekNumber column if missing (e.g. existing DB created before week-based fixtures)
    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE Matches ADD COLUMN WeekNumber INTEGER NULL");
    }
    catch
    {
        // Column already exists (e.g. new DB) or other schema issue — ignore
    }
    await SeedData.InitializeAsync(db);
}

app.Run();
