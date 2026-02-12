import { Worker } from "bullmq";

import { logger } from "@payment-gateway/observability";
import { PrismaOutboxRepository } from "@payment-gateway/persistence";

import { createRedisConnection, queueNames } from "../queues.js";

export function startReconciliationWorker(redisUrl: string) {
  const outboxRepository = new PrismaOutboxRepository();

  const worker = new Worker(
    queueNames.reconciliation,
    async () => {
      const events = await outboxRepository.listPending(50);

      for (const event of events) {
        try {
          await outboxRepository.markProcessed(event.id);
        } catch (error) {
          await outboxRepository.markFailed(event.id, new Date(Date.now() + 60_000));
          logger.error({ eventId: event.id, error }, "Failed processing outbox event");
        }
      }

      return { processed: events.length };
    },
    {
      connection: createRedisConnection(redisUrl)
    }
  );

  worker.on("completed", (job, result) => {
    logger.info({ jobId: job.id, result }, "Reconciliation run completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Reconciliation job failed");
  });

  return worker;
}
