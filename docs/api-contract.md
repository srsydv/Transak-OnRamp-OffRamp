# API Contract (v1)

## Auth
- Header: `x-api-key` required for merchant endpoints.
- Header: `idempotency-key` required for all mutating merchant endpoints.

## Endpoints

### `POST /v1/payment-intents`
Creates a payment intent.

Request:
```json
{
  "amount": 1000,
  "currency": "USD",
  "customerRef": "cust_123",
  "metadata": { "orderId": "order_1" }
}
```

### `GET /v1/payment-intents/:paymentIntentId`
Fetches one payment intent for the authenticated merchant.

### `POST /v1/payment-intents/:paymentIntentId/confirm`
Confirms and authorizes a payment intent.

Request:
```json
{
  "paymentMethodToken": "tok_visa",
  "provider": "mock"
}
```

### `POST /v1/payment-intents/:paymentIntentId/capture`
Captures an authorized payment.

Request:
```json
{
  "amount": 500
}
```

### `POST /v1/payment-intents/:paymentIntentId/void`
Voids an authorized payment.

### `POST /v1/refunds`
Creates a refund for a captured charge.

Request:
```json
{
  "chargeId": "ch_123",
  "amount": 500,
  "reason": "requested_by_customer"
}
```

### `GET /v1/refunds/:refundId`
Fetches one refund for the authenticated merchant.

### `POST /v1/webhooks/providers/:provider`
Validates provider webhook signature and enqueues processing.

Headers:
- `x-provider-signature`

### `GET /v1/healthz`
Liveness probe.

### `GET /v1/readyz`
Readiness probe (database connectivity).
