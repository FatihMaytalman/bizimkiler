# Railway deployment for Bizimkiler API

Deploy the NestJS API (`apps/api`) to [Railway](https://railway.com) from this monorepo. The web app (Cloudflare Workers or Vercel) calls the API at build time via `NEXT_PUBLIC_API_BASE_URL`.

## Architecture

| Surface | Host | Notes |
| --- | --- | --- |
| NestJS API | Railway service | `railway.json` at repo root |
| PostgreSQL | Railway Postgres plugin | Injects `DATABASE_URL` |
| Web app | Cloudflare Workers / Vercel | Set `NEXT_PUBLIC_API_BASE_URL` to the Railway API URL |

## One-time Railway setup

1. Create a new Railway project and connect this GitHub repository.
2. Add a **PostgreSQL** plugin to the project.
3. Create a **service** for the API with:
   - **Root directory:** `/` (monorepo root — required for `packages/shared`)
   - **Config file:** `railway.json` (auto-detected at repo root)
4. Link the Postgres plugin to the API service so Railway injects `DATABASE_URL`.
5. Generate a public domain for the API service (e.g. `bizimkiler-api.up.railway.app`).

## Required environment variables (API service)

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | *(from Postgres plugin)* | Auto-injected when linked |
| `NODE_ENV` | `production` | Railway sets this on deploy |
| `AOM_JWT_SECRET` | 32+ random bytes | Required in production |
| `CORS_ORIGINS` | `https://aomlegacy.com,https://your-app.pages.dev` | Comma-separated; `*.vercel.app` and `*.pages.dev` wildcards supported |

## First-deploy superadmin bootstrap

Set these **once** on the API service, deploy, then remove `AOM_SUPERADMIN_PASSWORD` from Railway variables:

| Variable | Notes |
| --- | --- |
| `AOM_SUPERADMIN_EMAIL` | Platform admin login email |
| `AOM_SUPERADMIN_PASSWORD` | Plain-text password (hashed on boot; remove after first deploy) |
| `AOM_SUPERADMIN_DISPLAY_NAME` | Optional display name |

On startup the API creates the account if it does not exist, or promotes an existing account to `superadmin`. Migrations run automatically.

## Web app configuration

Set at **build time** on your web host (GitHub Actions vars, Vercel, or Cloudflare):

```bash
NEXT_PUBLIC_API_BASE_URL=https://<your-railway-domain>/api
NEXT_PUBLIC_SITE_URL=https://aomlegacy.com
```

The URL must include the `/api` prefix — the NestJS app uses a global prefix of `api`.

Verify connectivity:

```bash
curl https://<your-railway-domain>/api/health
```

## Optional variables

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude heritage assistant |
| `IMMICH_URL` / `IMMICH_API_KEY` | Immich media sync |
| `BIZIMKILER_UPLOADS_DIR` | Memory photo storage (ephemeral on Railway unless you attach a volume) |

## Local development with Railway Postgres

You can point local `.env` at a Railway Postgres instance using the `DATABASE_URL` from the Railway dashboard, or use discrete `AOM_DB_*` vars for a local Postgres instance (see `apps/api/.env.example`).

## Health check

Railway uses `GET /api/health` (configured in `railway.json`). The endpoint probes database connectivity and reports service status.
