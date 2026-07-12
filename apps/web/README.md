# AOM Legacy Web App

Next.js App Router frontend for the Family Tree platform.

Stack: **Next.js**, **React**, **TypeScript**, **Tailwind CSS v4**, **TanStack Query**, **Framer Motion**, and shared types from `@aomlegacy/shared`.

## Phase 1 status

Implemented in this scaffold:

- Heritage design tokens from the master plan (navy, gold, turquoise, cream, warm white).
- Typography via Playfair Display, Inter, and JetBrains Mono.
- Public landing page, sign-in shell, and family switcher.
- Family workspace shell with sidebar navigation.
- Dashboard shell with API health probe, recent uploads placeholders, and backup health placeholders.
- Route shells for timeline, people, tree, media, review, and settings.

Planned next:

- Authentication wired to the NestJS API.
- TanStack Query hooks backed by `@aomlegacy/shared` types.
- Immich-backed media grid and duplicate review flows.

## Local development

From the monorepo root:

```bash
npm install
npm run dev:web
```

Or from this directory:

```bash
cd apps/web
cp .env.example .env.local
npm run dev
```

The app binds to `0.0.0.0` and listens on `PORT` when set. Local `npm run dev` falls back to port `3000`; production `npm run start` requires `PORT` (set to `3000` in the self-hosted Compose stack).

## Self-hosted routing

When running through the Docker Compose stack:

- The public landing page is available at `http://localhost:8080/`.
- Family Tree web routes are proxied at `/`, `/login`, `/families`, and `/family/*`.
- Immich media library is proxied at `/photos/`.
- The API is available at `/api/*`.
- The full Next.js app is also exposed directly on port `3000`.

## App routes

```text
/                      public landing page
/login                 authentication shell
/families              family switcher
/family/[id]           dashboard
/family/[id]/timeline  family timeline
/family/[id]/people    people directory
/family/[id]/people/[personId]
/family/[id]/tree      interactive tree
/family/[id]/media     media library
/family/[id]/review    dedup/faces/OCR/AI review queue
/family/[id]/settings  roles, backups, export, privacy
```

## Design foundation

The design system follows the premium heritage identity in `docs/family-tree/master-plan.md`:

- Dark Navy `#0D1B2A`
- Polished Gold `#C9A84C`
- Turquoise `#2EC4B6`
- Deep Charcoal `#1A1A2E`
- Soft Cream `#F8F4EE`
- Warm White `#F0EDE8`

The app uses Next.js 16.2.x for Cloudflare OpenNext compatibility. Revisit version pins when upgrading the adapter.
