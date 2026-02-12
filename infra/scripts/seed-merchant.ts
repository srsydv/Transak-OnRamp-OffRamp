import { createHmac, randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashApiKey(apiKey: string, secret: string): string {
  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

async function main() {
  const merchantName = process.argv[2] ?? "Demo Merchant";
  const apiKeySecret = process.env.API_KEY_HASH_SECRET ?? "dev_api_key_hash_secret";

  const merchant = await prisma.merchant.create({
    data: {
      name: merchantName
    }
  });

  const apiKey = `pg_test_${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(apiKey, apiKeySecret);

  const createdApiKey = await prisma.apiKey.create({
    data: {
      merchantId: merchant.id,
      keyHash,
      label: "local-seeded-key"
    }
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    merchantId: merchant.id,
    apiKeyId: createdApiKey.id,
    apiKey
  }, null, 2));
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
