import { Queue } from "bullmq";
import { SignatureStatus } from "@prisma/client";
import { PrismaAuditLogRepository, PrismaWebhookRepository } from "@payment-gateway/persistence";
import type { ProviderRegistry } from "@payment-gateway/provider-sdk";

import { queueNames } from "@payment-gateway/jobs";

import { BadRequestError } from "../utils/errors.js";
import { sha256 } from "../utils/hash.js";

export class WebhookService {
  constructor(
    private readonly webhookRepository: PrismaWebhookRepository,
    private readonly auditLogRepository: PrismaAuditLogRepository,
    private readonly providerRegistry: ProviderRegistry,
    private readonly webhookQueue: Queue,
    private readonly webhookSecret: string
  ) {}

  async ingest(providerName: string, payload: string, signature: string) {
    if (!signature) {
      throw new BadRequestError("Missing webhook signature");
    }

    const provider = this.providerRegistry.get(providerName);
    const parsed = await provider.parseWebhook({
      body: payload,
      signature,
      secret: this.webhookSecret
    });

    const createResult = await this.webhookRepository.createIfAbsent({
      provider: providerName,
      eventId: parsed.eventId,
      eventType: parsed.eventType,
      signatureStatus: SignatureStatus.valid,
      payloadHash: sha256(payload),
      payload: parsed.payload
    });

    if (!createResult.created || !createResult.id) {
      return {
        accepted: true,
        duplicate: true
      };
    }

    await this.webhookQueue.add(
      "process-webhook-event",
      { webhookEventId: createResult.id },
      {
        removeOnComplete: true,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000
        }
      }
    );

    await this.auditLogRepository.write({
      actorType: "system",
      action: "webhook.received",
      entityType: "provider_webhook_event",
      entityId: createResult.id,
      details: {
        provider: providerName,
        eventId: parsed.eventId,
        eventType: parsed.eventType,
        queue: queueNames.webhookRetry
      }
    });

    return {
      accepted: true,
      duplicate: false
    };
  }
}
