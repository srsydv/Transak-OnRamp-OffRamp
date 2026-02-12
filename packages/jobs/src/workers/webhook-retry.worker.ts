import { Worker } from "bullmq";

import { logger } from "@payment-gateway/observability";
import { PrismaWebhookRepository } from "@payment-gateway/persistence";

import { createRedisConnection, queueNames } from "../queues.js";

interface WebhookRetryJob {
  webhookEventId: string;
}

export function startWebhookRetryWorker(redisUrl: string) {
  const repository = new PrismaWebhookRepository();

  const worker = new Worker<WebhookRetryJob>(
    queueNames.webhookRetry,
    async (job) => {
      await repository.markProcessed(job.data.webhookEventId);
      logger.info({ jobId: job.id, webhookEventId: job.data.webhookEventId }, "Webhook event processed");
    },
    {
      connection: createRedisConnection(redisUrl)
    }
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Webhook retry job failed");
  });

  return worker;
}
