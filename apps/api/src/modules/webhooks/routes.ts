import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { WebhookService } from "../../services/webhookService.js";

interface WebhookRouteDeps {
  webhookService: WebhookService;
}

export async function registerWebhookRoutes(app: FastifyInstance, deps: WebhookRouteDeps): Promise<void> {
  app.post(
    "/v1/webhooks/providers/:provider",
    {
      config: {
        rawBody: true
      }
    },
    async (request, reply) => {
      const params = z.object({ provider: z.string().min(1) }).parse(request.params);
      const signatureHeader = request.headers["x-provider-signature"];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader ?? "";
      const payloadSource = request.rawBody ?? JSON.stringify(request.body ?? {});
      const payload = Buffer.isBuffer(payloadSource) ? payloadSource.toString("utf8") : payloadSource;

      const result = await deps.webhookService.ingest(params.provider, payload, signature);

      reply.code(202);
      return result;
    }
  );
}
