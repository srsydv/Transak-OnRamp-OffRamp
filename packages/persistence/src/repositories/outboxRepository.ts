import { OutboxStatus, Prisma } from "@prisma/client";

import { prisma } from "../client.js";

export class PrismaOutboxRepository {
  async enqueue(input: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }) {
    return prisma.outboxEvent.create({
      data: {
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: input.payload as Prisma.InputJsonValue,
        status: OutboxStatus.PENDING
      }
    });
  }

  async listPending(limit = 100) {
    return prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PENDING,
        nextRunAt: {
          lte: new Date()
        }
      },
      take: limit,
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async markProcessed(id: string) {
    return prisma.outboxEvent.update({
      where: {
        id
      },
      data: {
        status: OutboxStatus.PROCESSED
      }
    });
  }

  async markFailed(id: string, nextRunAt: Date) {
    return prisma.outboxEvent.update({
      where: {
        id
      },
      data: {
        status: OutboxStatus.FAILED,
        attempts: {
          increment: 1
        },
        nextRunAt
      }
    });
  }
}
