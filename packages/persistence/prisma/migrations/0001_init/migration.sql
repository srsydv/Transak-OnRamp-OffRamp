CREATE TYPE "PaymentIntentStatus" AS ENUM (
  'requires_confirmation',
  'processing',
  'requires_capture',
  'succeeded',
  'canceled',
  'failed'
);

CREATE TYPE "ChargeStatus" AS ENUM (
  'authorized',
  'partially_captured',
  'captured',
  'voided',
  'failed'
);

CREATE TYPE "RefundStatus" AS ENUM (
  'pending',
  'succeeded',
  'failed'
);

CREATE TYPE "SignatureStatus" AS ENUM ('valid', 'invalid');
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('pending', 'processed', 'failed');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

CREATE TABLE "Merchant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "label" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentIntent" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentIntentStatus" NOT NULL,
  "customerRef" TEXT,
  "metadata" JSONB,
  "paymentMethodToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Charge" (
  "id" TEXT NOT NULL,
  "paymentIntentId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerChargeId" TEXT NOT NULL,
  "authorizedAmount" INTEGER NOT NULL,
  "capturedAmount" INTEGER NOT NULL DEFAULT 0,
  "status" "ChargeStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "chargeId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT,
  "status" "RefundStatus" NOT NULL,
  "providerRefundId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyKey" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "responseSnapshot" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "signatureStatus" "SignatureStatus" NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processingStatus" "WebhookProcessingStatus" NOT NULL DEFAULT 'pending',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_merchantId_idx" ON "ApiKey"("merchantId");
CREATE INDEX "PaymentIntent_merchantId_createdAt_idx" ON "PaymentIntent"("merchantId", "createdAt");
CREATE UNIQUE INDEX "Charge_providerChargeId_key" ON "Charge"("providerChargeId");
CREATE INDEX "Charge_paymentIntentId_idx" ON "Charge"("paymentIntentId");
CREATE INDEX "Refund_chargeId_idx" ON "Refund"("chargeId");
CREATE UNIQUE INDEX "IdempotencyKey_merchantId_idempotencyKey_key" ON "IdempotencyKey"("merchantId", "idempotencyKey");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");
CREATE UNIQUE INDEX "ProviderWebhookEvent_provider_eventId_key" ON "ProviderWebhookEvent"("provider", "eventId");
CREATE INDEX "ProviderWebhookEvent_processingStatus_receivedAt_idx" ON "ProviderWebhookEvent"("processingStatus", "receivedAt");
CREATE INDEX "AuditLog_merchantId_createdAt_idx" ON "AuditLog"("merchantId", "createdAt");
CREATE INDEX "OutboxEvent_status_nextRunAt_idx" ON "OutboxEvent"("status", "nextRunAt");

ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT "PaymentIntent_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Charge"
  ADD CONSTRAINT "Charge_paymentIntentId_fkey"
  FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_chargeId_fkey"
  FOREIGN KEY ("chargeId") REFERENCES "Charge"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IdempotencyKey"
  ADD CONSTRAINT "IdempotencyKey_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
