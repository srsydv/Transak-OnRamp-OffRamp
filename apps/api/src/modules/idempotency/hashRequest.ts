import type { FastifyRequest } from "fastify";

import { sha256 } from "../../utils/hash.js";

export function buildRequestHash(request: FastifyRequest, merchantId: string): string {
  const body = request.body ? JSON.stringify(request.body) : "";
  const materialized = `${merchantId}:${request.method}:${request.url}:${body}`;
  return sha256(materialized);
}
