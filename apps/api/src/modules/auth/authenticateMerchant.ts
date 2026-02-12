import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { PrismaAuditLogRepository, PrismaAuthRepository } from "@payment-gateway/persistence";

import { UnauthorizedError } from "../../utils/errors.js";
import { hashApiKey } from "../../utils/hash.js";

export function buildAuthenticateMerchant(deps: {
  authRepository: PrismaAuthRepository;
  auditLogRepository: PrismaAuditLogRepository;
  hashSecret: string;
}): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const apiKeyHeader = request.headers["x-api-key"];
    if (!apiKeyHeader || Array.isArray(apiKeyHeader)) {
      throw new UnauthorizedError("Missing x-api-key header");
    }

    const keyHash = hashApiKey(apiKeyHeader, deps.hashSecret);
    const merchant = await deps.authRepository.findMerchantByApiKeyHash(keyHash);
    if (!merchant) {
      await deps.auditLogRepository.write({
        actorType: "system",
        action: "auth.failed",
        entityType: "api_key",
        entityId: "unknown",
        details: {
          reason: "invalid_api_key"
        }
      });
      throw new UnauthorizedError("Invalid API key");
    }

    request.merchant = {
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      apiKeyId: merchant.apiKeyId
    };

    await deps.auditLogRepository.write({
      merchantId: merchant.merchantId,
      actorType: "merchant",
      actorId: merchant.apiKeyId,
      action: "auth.succeeded",
      entityType: "api_key",
      entityId: merchant.apiKeyId
    });
  };
}
