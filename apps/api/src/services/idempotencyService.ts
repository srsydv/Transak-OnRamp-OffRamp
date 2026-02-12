import { Prisma } from "@prisma/client";
import { PrismaIdempotencyRepository } from "@payment-gateway/persistence";

import { ConflictError } from "../utils/errors.js";

interface ResponseSnapshot {
  statusCode: number;
  body: unknown;
}

export class IdempotencyService {
  constructor(private readonly repository: PrismaIdempotencyRepository) {}

  async getReplayIfExists(input: {
    merchantId: string;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<ResponseSnapshot | null> {
    const record = await this.repository.findByKey(input.merchantId, input.idempotencyKey);
    if (!record) {
      return null;
    }

    if (record.requestHash !== input.requestHash) {
      throw new ConflictError("Idempotency key reuse with different payload is not allowed");
    }

    const snapshot = record.responseSnapshot as Prisma.JsonObject;

    return {
      statusCode: Number(snapshot.statusCode),
      body: snapshot.body
    };
  }

  async storeResult(input: {
    merchantId: string;
    idempotencyKey: string;
    requestHash: string;
    responseSnapshot: ResponseSnapshot;
    ttlHours?: number;
  }): Promise<void> {
    const ttlHours = input.ttlHours ?? 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    try {
      await this.repository.createRecord({
        merchantId: input.merchantId,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        responseSnapshot: input.responseSnapshot,
        expiresAt
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }

      throw error;
    }
  }
}
