import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { IdempotencyService } from "../../services/idempotencyService.js";
import type { PaymentService } from "../../services/paymentService.js";
import { BadRequestError } from "../../utils/errors.js";
import { executeIdempotentMutation } from "../idempotency/executeIdempotent.js";

const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  customerRef: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const confirmPaymentIntentSchema = z.object({
  paymentMethodToken: z.string().min(1),
  provider: z.string().default("mock")
});

const capturePaymentIntentSchema = z.object({
  amount: z.number().int().positive().optional()
});

interface PaymentRouteDeps {
  paymentService: PaymentService;
  idempotencyService: IdempotencyService;
}

export async function registerPaymentRoutes(app: FastifyInstance, deps: PaymentRouteDeps): Promise<void> {
  app.post("/v1/payment-intents", async (request, reply) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    await executeIdempotentMutation(request, reply, deps.idempotencyService, async () => {
      const body = createPaymentIntentSchema.parse(request.body ?? {});
      const paymentIntent = await deps.paymentService.createPaymentIntent({
        merchantId: request.merchant!.merchantId,
        amount: body.amount,
        currency: body.currency.toUpperCase(),
        customerRef: body.customerRef,
        metadata: body.metadata
      });

      return {
        statusCode: 201,
        body: paymentIntent
      };
    });
  });

  app.get("/v1/payment-intents/:paymentIntentId", async (request) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);

    return deps.paymentService.getPaymentIntent(request.merchant.merchantId, params.paymentIntentId);
  });

  app.post("/v1/payment-intents/:paymentIntentId/confirm", async (request, reply) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    await executeIdempotentMutation(request, reply, deps.idempotencyService, async () => {
      const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);
      const body = confirmPaymentIntentSchema.parse(request.body ?? {});

      const result = await deps.paymentService.confirmPaymentIntent({
        merchantId: request.merchant!.merchantId,
        paymentIntentId: params.paymentIntentId,
        paymentMethodToken: body.paymentMethodToken,
        provider: body.provider
      });

      return {
        statusCode: 200,
        body: result
      };
    });
  });

  app.post("/v1/payment-intents/:paymentIntentId/capture", async (request, reply) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    await executeIdempotentMutation(request, reply, deps.idempotencyService, async () => {
      const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);
      const body = capturePaymentIntentSchema.parse(request.body ?? {});

      const result = await deps.paymentService.capturePaymentIntent({
        merchantId: request.merchant!.merchantId,
        paymentIntentId: params.paymentIntentId,
        amount: body.amount
      });

      return {
        statusCode: 200,
        body: result
      };
    });
  });

  app.post("/v1/payment-intents/:paymentIntentId/void", async (request, reply) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    await executeIdempotentMutation(request, reply, deps.idempotencyService, async () => {
      const params = z.object({ paymentIntentId: z.string().min(1) }).parse(request.params);

      const result = await deps.paymentService.voidPaymentIntent({
        merchantId: request.merchant!.merchantId,
        paymentIntentId: params.paymentIntentId
      });

      return {
        statusCode: 200,
        body: result
      };
    });
  });
}
