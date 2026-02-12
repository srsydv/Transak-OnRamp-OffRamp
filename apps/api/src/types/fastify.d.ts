import "fastify";

import type { MerchantContext } from "./merchant.js";

declare module "fastify" {
  interface FastifyRequest {
    merchant?: MerchantContext;
    rawBody?: string;
  }
}
