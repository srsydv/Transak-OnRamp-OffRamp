import { Queue, type JobsOptions, type QueueOptions } from "bullmq";
import { Redis } from "ioredis";

export const queueNames = {
  webhookRetry: "webhook-retry",
  reconciliation: "reconciliation"
} as const;

export function createRedisConnection(redisUrl: string) {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

function queueOptions(redisUrl: string): QueueOptions {
  return {
    connection: createRedisConnection(redisUrl)
  };
}

export function createQueue(name: string, redisUrl: string) {
  return new Queue(name, queueOptions(redisUrl));
}

export async function enqueueJob(
  name: string,
  redisUrl: string,
  jobName: string,
  payload: Record<string, unknown>,
  opts?: JobsOptions
) {
  const queue = createQueue(name, redisUrl);
  await queue.add(jobName, payload, opts);
  await queue.close();
}
