# Using Supabase as the database

The API uses **PostgreSQL** via the Supabase connection string. No SQLite or local DB file.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose org, name, database password, region.
3. Wait for the project to be ready.

## 2. Get the connection string

1. In the Supabase dashboard: **Project Settings** (gear) → **Database**.
2. Under **Connection string**, choose **URI** or **Session mode**.
3. Copy the connection string. It looks like:
   - **URI**: `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - Or use **Direct connection** (port 5432) for non-pooled:
     - Host: `db.[project-ref].supabase.co`
     - Port: `5432`
     - Database: `postgres`
     - User: `postgres`
     - Password: your database password

4. For **Npgsql** (this API), use either:
   - The URI as-is (Npgsql accepts `postgresql://...`), or
   - Assembled:  
     `Host=db.xxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true`

## 3. Configure the API

Set the connection string in one of these ways (don’t commit real passwords).

### Option A: User secrets (local dev)

```bash
cd LeagueManagementApi
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=db.xxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
```

### Option B: appsettings.Development.json (local dev)

`appsettings.Development.json` is in `.gitignore`. Copy from the example:  
`cp appsettings.Development.example.json appsettings.Development.json`  
then edit and replace `YOUR_PROJECT_REF` and `YOUR_PASSWORD` with your Supabase details.

### Option C: Environment variable (Docker / production)

Set:

- **Key**: `ConnectionStrings__DefaultConnection`  
- **Value**: your full Supabase PostgreSQL connection string  

(In Docker Compose, use `environment` or an env file.)

## 4. Run the API

On first run, the API creates the app tables in Supabase (via `EnsureLeagueManagementSchemaAsync`) and runs seed data if the database is empty.

```bash
cd LeagueManagementApi
dotnet run
```

## 5. Optional: Connection pooling (Supabase pooler)

For serverless or many connections, use the **pooler** connection string from the Supabase dashboard (Session or Transaction mode, port **6543**). Use that string as `ConnectionStrings:DefaultConnection` instead of the direct port 5432 one.

---

**Note:** `Microsoft.Extensions.Configuration.Json` is already included in ASP.NET Core. You don’t need to add it as a package. Configuration is read from `appsettings.json`, environment variables, and user secrets by default.
