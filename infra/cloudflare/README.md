# Cloudflare deployment for AOMLegacy.com

The public landing page and Family Tree web app deploy to **Cloudflare Workers** using the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare).

## What deploys where

| Surface | Host | Notes |
| --- | --- | --- |
| Landing page + web app | Cloudflare Workers (`aomlegacy-web`) | `apps/web` via OpenNext |
| NestJS API + PostgreSQL | Railway or self-hosted Docker | See `infra/railway/README.md` for managed API deploy |
| Immich media library | Self-hosted Docker | Reachable at `/photos/` behind nginx |
| Claude AI | API server | Set `ANTHROPIC_API_KEY` on the API host |

## One-time Cloudflare setup

1. Create a Cloudflare account and add the **AOMLegacy.com** zone.
2. Create an API token with **Workers Scripts Edit** and **Account Settings Read**.
3. Add GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Add GitHub repository variables:
   - `NEXT_PUBLIC_API_BASE_URL` — e.g. `https://bizimkiler-api.up.railway.app/api` (Railway) or `https://api.aomlegacy.com/api` (self-hosted tunnel)
   - `NEXT_PUBLIC_SITE_URL` — `https://aomlegacy.com`
5. Connect the custom domain in the Cloudflare dashboard after the first deploy.

## Local commands

From `apps/web`:

```bash
npm run preview          # build + preview in Workers runtime
npm run deploy:cloudflare # build + deploy (needs wrangler auth)
```

From the monorepo root:

```bash
npm run health           # build/typecheck health check for all packages
```

## API + media behind Cloudflare Tunnel (recommended)

For a home server:

1. Run `docker compose --profile aom-app up -d` on the Ubuntu host.
2. Install `cloudflared` and create a tunnel for `api.aomlegacy.com` → `localhost:8080`.
3. Point `NEXT_PUBLIC_API_BASE_URL` at the public API URL.

The landing page on Cloudflare will then show live API and Claude health when the backend is reachable.

## Secrets you must provide (cannot be automated here)

- `ANTHROPIC_API_KEY` on the API server for Claude heritage assistance
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` for deploy automation
- Database passwords in `infra/self-hosted/.env` for the home server stack
