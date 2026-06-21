# Shopee CashBack Affiliate App

Generate a personal Shopee affiliate link for any product, share/use it, and earn cashback to your in-app wallet — but only once the resulting Shopee order is confirmed completed, never while pending and never if it's cancelled or returned.

## Stack

- `frontend/` — React + Vite + TypeScript
- `backend/` — Node.js + Express + TypeScript
- `packages/shared/` — TypeScript types/enums shared by both (`OrderStatus`, `EarningStatus`, DTOs)
- PostgreSQL for storage

## Local setup

```bash
cp .env.example .env   # fill in Shopee Affiliate Open API credentials
npm install
docker compose up -d   # starts Postgres
npm run build --workspace packages/shared
npm run migrate --workspace backend
npm run dev:backend     # http://localhost:4000
npm run dev:frontend    # http://localhost:5173
```

## How earnings work

Every Shopee conversion report row is synced through an idempotent state machine (`backend/src/modules/earnings/earnings.service.ts`):

- `PENDING` order → `PENDING` earning, no wallet effect.
- `COMPLETED` order → earning flips to `CONFIRMED`, wallet is credited.
- `CANCELLED` / `RETURNED` order → earning flips to `VOIDED`; if it had already been confirmed and credited, a reversing wallet transaction is recorded.

Sync happens via a scheduled poller (`backend/src/jobs/pollConversions.job.ts`) and an optional Shopee webhook (`/webhooks/shopee/conversion`), both feeding the same idempotent ingestion path so duplicates are harmless.

Run `npm test --workspace backend` to run the state machine unit tests.

## Deploying to Railway

This connects directly to the GitHub repo so pushes auto-redeploy. Create three things in one Railway project:

1. **Postgres** — add Railway's Postgres plugin; it exposes `DATABASE_URL` automatically.
2. **Backend service** — point it at this repo, root directory `backend/`.
   - Build command: `npm install && npm run build --workspace packages/shared --prefix .. && npm run build`
   - Start command: `npm run start`
   - Env vars: `DATABASE_URL` (reference the Postgres plugin), `JWT_SECRET`, and the `SHOPEE_*` vars from `.env.example`. Railway sets `PORT` automatically.
3. **Frontend service** — point it at this repo, root directory `frontend/`, deployed as a static site.
   - Build command: `npm install && npm run build`
   - Env var: `VITE_API_BASE_URL` set to the backend service's public Railway URL (e.g. `https://<backend>.up.railway.app`) — this is read at build time, so redeploy the frontend if the backend URL changes.

After the first deploy, run migrations once against Railway's Postgres: copy its connection string into a local `.env`, then run `npm run migrate --workspace backend`.

Once deployed, the frontend's Railway URL works from any browser — including a phone — with no local setup needed.
