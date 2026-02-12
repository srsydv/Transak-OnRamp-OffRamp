# Payment Gateway Architecture

## Overview
This service is a modular monolith built with Node.js + TypeScript.
Core modules are isolated by domain boundaries while sharing one process and one database.

## Modules
- `auth`: merchant API key validation with HMAC-hashed key lookup.
- `payments`: payment intent lifecycle (create, confirm, capture, void).
- `refunds`: refund creation and retrieval.
- `webhooks`: provider webhook validation, deduplication, and async queueing.
- `idempotency`: replay-safe mutation handling via request hashes.
- `health`: liveness/readiness probes.

## Storage and Messaging
- PostgreSQL stores merchant, payment, refund, idempotency, audit, webhook, and outbox records.
- Redis + BullMQ powers webhook retry and reconciliation workers.

## Key Flow
1. Merchant authenticates via `x-api-key`.
2. Mutating routes require `idempotency-key`.
3. Payment operations persist state, emit outbox events, and write audit logs.
4. Webhooks are signature validated and deduplicated before queue processing.

## Security Boundaries
- Raw PAN/CVV storage is disallowed by schema and API contracts.
- Request logs redact sensitive headers and payment tokens.
- Secrets are environment-driven and compatible with external secret managers.
