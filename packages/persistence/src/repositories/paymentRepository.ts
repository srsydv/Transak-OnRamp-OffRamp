import { ChargeStatus, PaymentIntentStatus, Prisma } from "@prisma/client";

import { prisma } from "../client.js";

export interface CreatePaymentIntentInput {
  merchantId: string;
  amount: number;
  currency: string;
  customerRef?: string;
  metadata?: Record<string, unknown>;
  paymentMethodToken?: string;
}

export class PrismaPaymentRepository {
  async createPaymentIntent(input: CreatePaymentIntentInput) {
    return prisma.paymentIntent.create({
      data: {
        merchantId: input.merchantId,
        amount: input.amount,
        currency: input.currency,
        status: PaymentIntentStatus.requires_confirmation,
        customerRef: input.customerRef,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        paymentMethodToken: input.paymentMethodToken
      }
    });
  }

  async getPaymentIntentForMerchant(paymentIntentId: string, merchantId: string) {
    return prisma.paymentIntent.findFirst({
      where: {
        id: paymentIntentId,
        merchantId
      },
      include: {
        charges: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });
  }

  async updatePaymentIntentStatus(paymentIntentId: string, status: PaymentIntentStatus) {
    return prisma.paymentIntent.update({
      where: {
        id: paymentIntentId
      },
      data: {
        status
      }
    });
  }

  async createCharge(input: {
    paymentIntentId: string;
    provider: string;
    providerChargeId: string;
    authorizedAmount: number;
    status: ChargeStatus;
  }) {
    return prisma.charge.create({
      data: {
        paymentIntentId: input.paymentIntentId,
        provider: input.provider,
        providerChargeId: input.providerChargeId,
        authorizedAmount: input.authorizedAmount,
        status: input.status
      }
    });
  }

  async getLatestChargeForPaymentIntent(paymentIntentId: string) {
    return prisma.charge.findFirst({
      where: {
        paymentIntentId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async updateChargeCapture(input: {
    chargeId: string;
    capturedAmount: number;
    status: ChargeStatus;
  }) {
    return prisma.charge.update({
      where: {
        id: input.chargeId
      },
      data: {
        capturedAmount: input.capturedAmount,
        status: input.status
      }
    });
  }

  async updateChargeStatus(chargeId: string, status: ChargeStatus) {
    return prisma.charge.update({
      where: {
        id: chargeId
      },
      data: {
        status
      }
    });
  }

  async findChargeForMerchant(chargeId: string, merchantId: string) {
    return prisma.charge.findFirst({
      where: {
        id: chargeId,
        paymentIntent: {
          merchantId
        }
      },
      include: {
        paymentIntent: true
      }
    });
  }
}
