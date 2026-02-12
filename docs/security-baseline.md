# Security Baseline

## Data Handling
- No PAN/CVV fields are present in API payloads, domain types, or database schema.
- Only provider tokens are accepted for payment method references.

## Authentication and Authorization
- Merchant API keys are stored as HMAC hashes.
- Merchant-scoped reads/writes are enforced in repository queries.

## Integrity Controls
- Idempotency key + request hash prevents duplicate mutation side effects.
- Webhooks require signature validation before persistence and queueing.
- Webhook event IDs are deduplicated with a unique DB constraint.

## Auditing
- Auth events and state transitions write to `audit_logs`.
- Outbox events provide traceable async state propagation.

## Secrets and Runtime
- Secrets are sourced from environment variables and can be injected by a secret manager.
- Logs redact API key and payment token fields.
