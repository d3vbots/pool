# Deploying to Netlify

This app is a **React frontend** only. The League Management API (.NET) must be hosted elsewhere (e.g. Azure, Railway, Fly.io) and its URL configured below.

## Build settings

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Base directory:** (leave empty, root of repo)

The repo includes `public/_redirects` so that all routes (e.g. `/leagues`, `/standings`) are served `index.html` with status 200. That way refreshes and direct links work instead of showing “Page not found”.

## Environment variables

Set these in **Netlify → Site → Site configuration → Environment variables**.

| Variable          | Required | Description |
|-------------------|----------|-------------|
| `VITE_API_URL`    | **Yes** (production) | Full base URL of your League Management API, **no trailing slash**. Example: `https://your-api.azurewebsites.net` or `https://league-api.example.com`. The frontend will send all API requests to this origin. |

### Examples

- API on Azure: `VITE_API_URL=https://pool-league-api.azurewebsites.net`
- API on Railway: `VITE_API_URL=https://your-app.up.railway.app`
- Custom domain: `VITE_API_URL=https://api.yourdomain.com`

After adding or changing `VITE_API_URL`, trigger a new deploy so the build picks it up.

## CORS

Your .NET API must allow the Netlify site origin in CORS (e.g. `https://your-site.netlify.app` or your custom domain). In the API project, ensure `WithOrigins()` includes that URL.
