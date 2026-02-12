import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/payment_gateway?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  API_KEY_HASH_SECRET: z.string().default("dev_api_key_hash_secret"),
  WEBHOOK_SECRET: z.string().default("dev_webhook_secret"),
  DEFAULT_PROVIDER: z.string().default("mock")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
