import type { FastifyReply, FastifyRequest } from "fastify";

import { IdempotencyService } from "../../services/idempotencyService.js";
import { BadRequestError } from "../../utils/errors.js";

import { buildRequestHash } from "./hashRequest.js";

interface OperationResult {
  statusCode: number;
  body: unknown;
}

export async function executeIdempotentMutation(
  request: FastifyRequest,
  reply: FastifyReply,
  idempotencyService: IdempotencyService,
  runOperation: () => Promise<OperationResult>
): Promise<void> {
  const idempotencyKey = request.headers["idempotency-key"];
  if (!idempotencyKey || Array.isArray(idempotencyKey)) {
    throw new BadRequestError("Missing idempotency-key header");
  }

  if (!request.merchant) {
    throw new BadRequestError("Merchant context missing");
  }

  const requestHash = buildRequestHash(request, request.merchant.merchantId);

  const replay = await idempotencyService.getReplayIfExists({
    merchantId: request.merchant.merchantId,
    idempotencyKey,
    requestHash
  });

  if (replay) {
    reply.header("idempotent-replay", "true").code(replay.statusCode).send(replay.body);
    return;
  }

  const result = await runOperation();

  await idempotencyService.storeResult({
    merchantId: request.merchant.merchantId,
    idempotencyKey,
    requestHash,
    responseSnapshot: {
      statusCode: result.statusCode,
      body: result.body
    }
  });

  reply.code(result.statusCode).send(result.body);
}
