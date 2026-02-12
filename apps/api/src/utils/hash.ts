import { createHash, createHmac } from "node:crypto";

export function hashApiKey(apiKey: string, secret: string): string {
  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
