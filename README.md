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
