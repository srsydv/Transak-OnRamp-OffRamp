import type { FastifyInstance } from "fastify";

import { prisma } from "@payment-gateway/persistence";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/healthz", async () => {
    return {
      status: "ok"
    };
  });

  app.get("/v1/readyz", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: "ready"
      };
    } catch (error) {
      request.log.error({ error }, "Readiness check failed");
      reply.code(503);
      return {
        status: "not_ready"
      };
    }
  });
}
