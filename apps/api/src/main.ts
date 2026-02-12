import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";

async function main() {
  const env = loadEnv();
  process.env.DATABASE_URL ??= env.DATABASE_URL;

  const app = await buildApp(env);

  await app.listen({
    host: env.HOST,
    port: env.PORT
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
