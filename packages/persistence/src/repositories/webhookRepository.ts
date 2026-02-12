import { Prisma, SignatureStatus, WebhookProcessingStatus } from "@prisma/client";

import { prisma } from "../client.js";

export class PrismaWebhookRepository {
  async createIfAbsent(input: {
    provider: string;
    eventId: string;
    eventType: string;
    signatureStatus: SignatureStatus;
    payloadHash: string;
    payload: Record<string, unknown>;
  }): Promise<{ created: boolean; id?: string }> {
    try {
      const created = await prisma.providerWebhookEvent.create({
        data: {
          provider: input.provider,
          eventId: input.eventId,
          eventType: input.eventType,
          signatureStatus: input.signatureStatus,
          payloadHash: input.payloadHash,
          payload: input.payload as unknown as Prisma.InputJsonValue
        }
      });

      return {
        created: true,
        id: created.id
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { created: false };
      }

      throw error;
    }
  }

  async markProcessed(id: string) {
    return prisma.providerWebhookEvent.update({
      where: {
        id
      },
      data: {
        processingStatus: WebhookProcessingStatus.processed,
        processedAt: new Date()
      }
    });
  }
}
