import { Prisma } from "@prisma/client";

import { prisma } from "../client.js";

interface ResponseSnapshot {
  statusCode: number;
  body: unknown;
}

export class PrismaIdempotencyRepository {
  async findByKey(merchantId: string, idempotencyKey: string) {
    return prisma.idempotencyKey.findUnique({
      where: {
        merchantId_idempotencyKey: {
          merchantId,
          idempotencyKey
        }
      }
    });
  }

  async createRecord(input: {
    merchantId: string;
    idempotencyKey: string;
    requestHash: string;
    responseSnapshot: ResponseSnapshot;
    expiresAt: Date;
  }) {
    return prisma.idempotencyKey.create({
      data: {
        merchantId: input.merchantId,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        responseSnapshot: input.responseSnapshot as unknown as Prisma.InputJsonValue,
        expiresAt: input.expiresAt
      }
    });
  }
}
