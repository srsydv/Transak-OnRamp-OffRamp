import { RefundStatus } from "@prisma/client";
import {
  PrismaAuditLogRepository,
  PrismaPaymentRepository,
  PrismaRefundRepository
} from "@payment-gateway/persistence";
import type { ProviderRegistry } from "@payment-gateway/provider-sdk";

import { BadRequestError, NotFoundError } from "../utils/errors.js";

interface CreateRefundInput {
  merchantId: string;
  chargeId: string;
  amount: number;
  reason?: string;
}

export class RefundService {
  constructor(
    private readonly paymentRepository: PrismaPaymentRepository,
    private readonly refundRepository: PrismaRefundRepository,
    private readonly auditLogRepository: PrismaAuditLogRepository,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  async createRefund(input: CreateRefundInput) {
    if (input.amount <= 0) {
      throw new BadRequestError("Refund amount must be greater than zero");
    }

    const charge = await this.paymentRepository.findChargeForMerchant(input.chargeId, input.merchantId);
    if (!charge) {
      throw new NotFoundError("Charge not found");
    }

    if (input.amount > charge.capturedAmount) {
      throw new BadRequestError("Refund amount exceeds captured amount");
    }

    const provider = this.providerRegistry.get(charge.provider);
    const refundResult = await provider.refund({
      providerChargeId: charge.providerChargeId,
      amount: input.amount,
      reason: input.reason
    });

    const status = refundResult.succeeded ? RefundStatus.succeeded : RefundStatus.failed;
    const refund = await this.refundRepository.createRefund({
      chargeId: charge.id,
      amount: input.amount,
      reason: input.reason,
      status,
      providerRefundId: refundResult.providerRefundId
    });

    await this.auditLogRepository.write({
      merchantId: input.merchantId,
      actorType: "merchant",
      action: "refund.created",
      entityType: "refund",
      entityId: refund.id,
      details: {
        chargeId: charge.id,
        amount: input.amount,
        status
      }
    });

    return refund;
  }

  async getRefund(merchantId: string, refundId: string) {
    const refund = await this.refundRepository.findRefundForMerchant(refundId, merchantId);
    if (!refund) {
      throw new NotFoundError("Refund not found");
    }

    return refund;
  }
}
