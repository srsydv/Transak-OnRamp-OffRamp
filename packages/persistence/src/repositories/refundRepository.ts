import { RefundStatus } from "@prisma/client";

import { prisma } from "../client.js";

export class PrismaRefundRepository {
  async createRefund(input: {
    chargeId: string;
    amount: number;
    reason?: string;
    status: RefundStatus;
    providerRefundId?: string;
  }) {
    return prisma.refund.create({
      data: {
        chargeId: input.chargeId,
        amount: input.amount,
        reason: input.reason,
        status: input.status,
        providerRefundId: input.providerRefundId
      }
    });
  }

  async findRefundForMerchant(refundId: string, merchantId: string) {
    return prisma.refund.findFirst({
      where: {
        id: refundId,
        charge: {
          paymentIntent: {
            merchantId
          }
        }
      },
      include: {
        charge: {
          include: {
            paymentIntent: true
          }
        }
      }
    });
  }
}
