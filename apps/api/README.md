# AOM Legacy API

NestJS service for the Family Tree platform. This scaffold implements Phase 1 database foundations and module boundaries described in the master plan.

Stack: **NestJS**, **TypeScript**, **PostgreSQL**, **TypeORM**.

## Phase 1 status

Implemented in this scaffold:

- PostgreSQL entities and initial migration for identity, family, person, media, and audit tables.
- Module boundaries for `Auth`, `Families`, `People`, `Media`, `Audit`, and `Health`.
- Automatic migration execution on startup.
- Health endpoint at `GET /api/health`.
- Immich asset sync proof of concept at `POST /api/media/sync/immich`.
- Manual Immich import endpoint at `POST /api/media/immich/import`.
- SHA-256 exact duplicate canonicalization with one canonical asset and many media instances.
- Database-backed media listing and deduplication candidate endpoints.

Planned next:

- Authentication and family-scoped authorization.
- Near-duplicate perceptual fingerprint candidates.
- REST endpoints for people mutations and media review decisions.

## Local development

```bash
cd apps/api
cp .env.example .env
npm install
npm run start:dev
```

The API listens on port `3001` by default.

Run migrations manually if needed:

```bash
npm run migration:run
```

## Docker Compose integration

When the self-hosted stack is running, start the API with:

```bash
cd infra/self-hosted
docker compose --profile aom-app up -d aom-api
```

The reverse proxy exposes the API at `http://localhost:8080/api/`.

## Canonical product data

This service owns Family Tree's canonical product data:

- families and memberships,
- person profiles,
- canonical media asset records,
- deduplication decisions,
- audit logs,
- and future AI, social, and export workflows.

Immich remains the Phase 1 media upload subsystem. AOM Legacy stores first-party metadata outside Immich so the product stays portable.

## Current scaffold

The initial NestJS scaffold includes:

- `GET /api/health`
- `GET /api/people`
- `GET /api/people/:id`
- `GET /api/media`
- `GET /api/media/deduplication-candidates`
- `GET /api/media/sync/immich/status?familyId=<uuid>`
- `POST /api/media/sync/immich`
- `POST /api/media/immich/import`
- `GET /api/social/connections`
- `GET /api/social/provenance`

Initial PostgreSQL migrations live in `migrations/` and TypeORM migrations under `src/database/migrations/`.

### Immich import proof of concept

`POST /api/media/immich/import` accepts a normalized Immich asset fingerprint:

```json
{
  "familyId": "00000000-0000-0000-0000-000000000000",
  "immichAssetId": "immich-asset-id",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "mediaType": "image",
  "byteSize": 123456,
  "storageUri": "immich://asset/immich-asset-id",
  "originalFilename": "IMG_0001.JPG",
  "capturedAt": "2026-07-05T00:00:00.000Z"
}
```

### Immich sync worker

`POST /api/media/sync/immich` polls Immich metadata, downloads originals, computes SHA-256, and canonicalizes exact duplicates into one `media_asset` with additional `media_instance` rows.

Configure:

```bash
IMMICH_URL=http://immich-server:2283
IMMICH_API_KEY=<immich-admin-api-key>
```

The API uses `@nestjs/platform-fastify` as its runtime adapter. As of this scaffold, `@nestjs/core` still installs `@nestjs/platform-express` transitively, which brings a vulnerable Multer version into `npm audit` even though the application does not use the Express adapter or Multer upload handling. Do not enable Nest Express uploads until the upstream dependency resolves to a patched Multer release or a safe override is verified.

## Local commands

From the repository root:

```bash
npm run dev:api
npm run typecheck -w apps/api
npm run build -w apps/api
```

## Railway deployment

The API deploys to Railway from the monorepo root using `railway.json`. See `infra/railway/README.md` for Postgres linking, CORS, superadmin bootstrap, and web app `NEXT_PUBLIC_API_BASE_URL` setup.
