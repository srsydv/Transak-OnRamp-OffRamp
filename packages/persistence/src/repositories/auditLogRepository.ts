import { Prisma } from "@prisma/client";

import { prisma } from "../client.js";

export class PrismaAuditLogRepository {
  async write(input: {
    merchantId?: string;
    actorType: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        merchantId: input.merchantId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details ? (input.details as Prisma.InputJsonValue) : Prisma.JsonNull
      }
    });
  }
}
