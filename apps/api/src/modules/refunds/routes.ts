import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { IdempotencyService } from "../../services/idempotencyService.js";
import type { RefundService } from "../../services/refundService.js";
import { BadRequestError } from "../../utils/errors.js";
import { executeIdempotentMutation } from "../idempotency/executeIdempotent.js";

const createRefundSchema = z.object({
  chargeId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().optional()
});

interface RefundRouteDeps {
  refundService: RefundService;
  idempotencyService: IdempotencyService;
}

export async function registerRefundRoutes(app: FastifyInstance, deps: RefundRouteDeps): Promise<void> {
  app.post("/v1/refunds", async (request, reply) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    await executeIdempotentMutation(request, reply, deps.idempotencyService, async () => {
      const body = createRefundSchema.parse(request.body ?? {});

      const result = await deps.refundService.createRefund({
        merchantId: request.merchant!.merchantId,
        chargeId: body.chargeId,
        amount: body.amount,
        reason: body.reason
      });

      return {
        statusCode: 201,
        body: result
      };
    });
  });

  app.get("/v1/refunds/:refundId", async (request) => {
    if (!request.merchant) {
      throw new BadRequestError("Merchant context missing");
    }

    const params = z.object({ refundId: z.string().min(1) }).parse(request.params);

    return deps.refundService.getRefund(request.merchant.merchantId, params.refundId);
  });
}
