import { describe, expect, it } from "vitest";

import { ConflictError } from "../utils/errors.js";
import { IdempotencyService } from "./idempotencyService.js";

class InMemoryIdempotencyRepository {
  private readonly store = new Map<string, {
    merchantId: string;
    idempotencyKey: string;
    requestHash: string;
    responseSnapshot: unknown;
    expiresAt: Date;
  }>();

  async findByKey(merchantId: string, idempotencyKey: string) {
    return this.store.get(`${merchantId}:${idempotencyKey}`) ?? null;
  }

  async createRecord(input: {
    merchantId: string;
    idempotencyKey: string;
    requestHash: string;
    responseSnapshot: unknown;
    expiresAt: Date;
  }) {
    this.store.set(`${input.merchantId}:${input.idempotencyKey}`, input);
    return input;
  }
}

describe("IdempotencyService", () => {
  it("replays an existing response for matching request hash", async () => {
    const repo = new InMemoryIdempotencyRepository();
    const service = new IdempotencyService(repo as never);

    await service.storeResult({
      merchantId: "m_1",
      idempotencyKey: "idem_1",
      requestHash: "hash_1",
      responseSnapshot: {
        statusCode: 201,
        body: { id: "pi_1" }
      }
    });

    const replay = await service.getReplayIfExists({
      merchantId: "m_1",
      idempotencyKey: "idem_1",
      requestHash: "hash_1"
    });

    expect(replay).toEqual({
      statusCode: 201,
      body: { id: "pi_1" }
    });
  });

  it("throws conflict for different request hash with same idempotency key", async () => {
    const repo = new InMemoryIdempotencyRepository();
    const service = new IdempotencyService(repo as never);

    await service.storeResult({
      merchantId: "m_1",
      idempotencyKey: "idem_1",
      requestHash: "hash_1",
      responseSnapshot: {
        statusCode: 201,
        body: { id: "pi_1" }
      }
    });

    await expect(
      service.getReplayIfExists({
        merchantId: "m_1",
        idempotencyKey: "idem_1",
        requestHash: "hash_2"
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
