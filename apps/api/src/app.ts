import Fastify from "fastify";
import rawBody from "fastify-raw-body";

import { createQueue, queueNames } from "@payment-gateway/jobs";
import {
  PrismaAuditLogRepository,
  PrismaAuthRepository,
  PrismaIdempotencyRepository,
  PrismaOutboxRepository,
  PrismaPaymentRepository,
  prisma,
  PrismaRefundRepository,
  PrismaWebhookRepository
} from "@payment-gateway/persistence";
import { ProviderRegistry } from "@payment-gateway/provider-sdk";

import { loadEnv, type AppEnv } from "./config/env.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import { buildAuthenticateMerchant } from "./modules/auth/authenticateMerchant.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerMerchantRoutes } from "./modules/merchants/routes.js";
import { registerPaymentRoutes } from "./modules/payments/routes.js";
import { registerRefundRoutes } from "./modules/refunds/routes.js";
import { registerWebhookRoutes } from "./modules/webhooks/routes.js";
import { IdempotencyService } from "./services/idempotencyService.js";
import { PaymentService } from "./services/paymentService.js";
import { RefundService } from "./services/refundService.js";
import { WebhookService } from "./services/webhookService.js";

export async function buildApp(overrides?: Partial<AppEnv>) {
  const env = {
    ...loadEnv(),
    ...overrides
  };

  process.env.DATABASE_URL ??= env.DATABASE_URL;

  const app = Fastify({
    logger: true
  });

  registerErrorHandler(app);

  await app.register(rawBody, {
    field: "rawBody",
    global: true,
    encoding: "utf8",
    runFirst: true
  });

  const authRepository = new PrismaAuthRepository();
  const paymentRepository = new PrismaPaymentRepository();
  const refundRepository = new PrismaRefundRepository();
  const idempotencyRepository = new PrismaIdempotencyRepository();
  const webhookRepository = new PrismaWebhookRepository();
  const auditLogRepository = new PrismaAuditLogRepository();
  const outboxRepository = new PrismaOutboxRepository();
  const providerRegistry = new ProviderRegistry();

  const idempotencyService = new IdempotencyService(idempotencyRepository);
  const paymentService = new PaymentService(
    paymentRepository,
    auditLogRepository,
    outboxRepository,
    providerRegistry
  );
  const refundService = new RefundService(
    paymentRepository,
    refundRepository,
    auditLogRepository,
    providerRegistry
  );

  const webhookQueue = createQueue(queueNames.webhookRetry, env.REDIS_URL);

  const webhookService = new WebhookService(
    webhookRepository,
    auditLogRepository,
    providerRegistry,
    webhookQueue,
    env.WEBHOOK_SECRET
  );

  const authenticateMerchant = buildAuthenticateMerchant({
    authRepository,
    auditLogRepository,
    hashSecret: env.API_KEY_HASH_SECRET
  });

  await registerHealthRoutes(app);
  await registerWebhookRoutes(app, { webhookService });

  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", authenticateMerchant);

    await registerMerchantRoutes(protectedRoutes);
    await registerPaymentRoutes(protectedRoutes, {
      paymentService,
      idempotencyService
    });
    await registerRefundRoutes(protectedRoutes, {
      refundService,
      idempotencyService
    });
  });

  app.addHook("onClose", async () => {
    await webhookQueue.close();
    await prisma.$disconnect();
  });

  return app;
}
