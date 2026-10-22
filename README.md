# NexusAI Video Studio — TechLab AI

A full-stack starter for a multi-provider AI video creation workspace. It combines a Next.js 15 App Router API, TypeScript provider adapters, PostgreSQL/Prisma wallet and task records, and a standalone Silver/Black Cyber-Armor interactive demo. The demo runs without API credentials; provider generation in the server project requires account credentials and valid provider API access.

## Capabilities

- **Provider abstraction:** Kling and Runway adapters share a typed factory and request/result contract. Provider keys remain server-side.
- **Credit wallet:** integer credits, transactional conditional debit (prevents overspending), per-task charge ledger, and idempotent automatic refund after provider submission errors. Demo rate is 10 credits/second.
- **Generation endpoint:** validates prompt and duration, creates a task, charges the wallet, submits to the chosen engine, and returns a task ID.
- **Interactive demo:** responsive dark metallic UI, generation lifecycle simulation, credit top-up simulation, activity log, and refund failure scenario.

## Project layout

```text
enterprise-codebase/       Next.js 15, TypeScript, Prisma, PostgreSQL
  prisma/schema.prisma     User, Wallet, VideoTask
  prisma/seed.ts           Demo user and 240-credit wallet
  src/app/api/generate/    POST video generation endpoint
  src/lib/providers/       Factory, KlingAdapter, RunwayAdapter
  src/services/            Atomic wallet and refund service
  Dockerfile
  docker-compose.yml
interactive-demo/           Standalone browser simulation
deploy-to-github.bat        Windows Git init/commit/main/push helper
```

## Run the standalone demo

Open `interactive-demo/index.html` in a modern browser. It uses simulated generation only, not provider APIs. To see the refund flow, open the page with `?simulate=fail` (for example `index.html?simulate=fail`). Top-up adds simulated credits.

## Run the application locally

Requirements: Node.js 22+, npm, and PostgreSQL 16+.

1. Change to `enterprise-codebase`; copy `.env.example` to `.env` and set a PostgreSQL `DATABASE_URL` plus provider keys as needed. Never commit `.env`.
2. Install and prepare the database:

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

3. Visit `http://localhost:3000`. Health check: `GET /api/health`.

The seed user is `demo@techlab.ai` with 240 credits. For local API testing, retrieve its ID from Prisma Studio (`npx prisma studio`) and send it as `x-user-id`. Example:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' -H 'x-user-id: YOUR_SEEDED_USER_ID' \
  -d '{"prompt":"A silver spacecraft above a quiet ocean at dawn","provider":"kling","duration":5,"aspectRatio":"16:9"}'
```

Accepted provider values: `kling` or `runway`; duration: 5–10 seconds; prompt: 3–2000 characters. Successful submission returns HTTP 202 and a provider task ID. This starter submits jobs but does not implement provider status polling or webhook delivery.

## Docker

From `enterprise-codebase`, configure `KLING_API_KEY` and/or `RUNWAY_API_KEY` in your shell or an ignored `.env` file, then run `docker compose up --build`. The Compose file starts PostgreSQL, applies the Prisma schema, and launches Next.js. Review and replace local database credentials and use a secrets manager in production.

## GitHub deployment helper

Run `deploy-to-github.bat` from the project root in Windows after creating an empty GitHub repository. It prompts for the repository URL, initializes Git, commits, renames the branch to `main`, and pushes. Configure Git identity beforehand.

## Production hardening — important

This is a starter, not a production-ready billing/auth system. The API's `x-user-id` header is a **development-only placeholder**: replace it with a verified session/JWT identity and authorization. Add provider webhook/polling handlers, request idempotency, retry/outbox logic, rate limits, moderation, observability, and robust reconciliation before launch. Provider endpoints and payloads can change; verify current provider API documentation and account entitlements. Validate duration/aspect ratio against each provider's supported options. Refunds currently cover synchronous submission exceptions; asynchronously failed tasks need a verified callback/poller that invokes `WalletService.refundTask` exactly once.

Wallet balances are integer credits. Debit uses a conditional update within a database transaction, so a low-balance request cannot overspend. Refund uses a transaction and `refundedAt` guard; test serializable transaction retries and operational database isolation behavior under real load. Never expose provider keys in frontend code.

## License

Starter project; add your organization's license and provider terms before distribution.
