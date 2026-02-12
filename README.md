# Payment Gateway

Node.js + TypeScript modular monolith payment gateway scaffold.

## Tech Stack
- Fastify API
- PostgreSQL + Prisma
- Redis + BullMQ
- Zod validation
- Pino logging

## Local Setup
1. Install dependencies:
   - `npm install`
2. Start infrastructure:
   - `docker compose -f infra/docker/docker-compose.yml up -d`
3. Configure env:
   - `cp .env.example .env`
4. Generate Prisma client and apply migrations:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
5. Seed a merchant/API key:
   - `npm run seed:merchant`
6. Start API:
   - `npm run dev`

## API Endpoints
- `POST /v1/payment-intents`
- `GET /v1/payment-intents/:paymentIntentId`
- `POST /v1/payment-intents/:paymentIntentId/confirm`
- `POST /v1/payment-intents/:paymentIntentId/capture`
- `POST /v1/payment-intents/:paymentIntentId/void`
- `POST /v1/refunds`
- `GET /v1/refunds/:refundId`
- `POST /v1/webhooks/providers/:provider`
- `GET /v1/healthz`
- `GET /v1/readyz`

## Notes
- Merchant routes require `x-api-key` and mutation routes require `idempotency-key`.
- The schema does not include PAN/CVV fields; only provider tokens are accepted.
