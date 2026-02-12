import type { FastifyInstance } from "fastify";

export async function registerMerchantRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/merchants/me", async (request) => {
    return {
      merchantId: request.merchant?.merchantId,
      merchantName: request.merchant?.merchantName,
      apiKeyId: request.merchant?.apiKeyId
    };
  });
}
