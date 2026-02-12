import { prisma } from "../client.js";

export interface AuthMerchant {
  merchantId: string;
  merchantName: string;
  apiKeyId: string;
}

export class PrismaAuthRepository {
  async findMerchantByApiKeyHash(keyHash: string): Promise<AuthMerchant | null> {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        active: true
      },
      include: {
        merchant: true
      }
    });

    if (!apiKey) {
      return null;
    }

    return {
      merchantId: apiKey.merchant.id,
      merchantName: apiKey.merchant.name,
      apiKeyId: apiKey.id
    };
  }
}
