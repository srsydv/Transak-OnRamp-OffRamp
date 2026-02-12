import {
  assertCaptureAmount,
  assertVoidable,
  transitionChargeAfterCapture,
  transitionPaymentIntent,
  type ChargeStatus,
  type PaymentIntentStatus
} from "@payment-gateway/domain";
import {
  PrismaAuditLogRepository,
  PrismaOutboxRepository,
  PrismaPaymentRepository
} from "@payment-gateway/persistence";
import type { ProviderRegistry } from "@payment-gateway/provider-sdk";

import { BadRequestError, NotFoundError } from "../utils/errors.js";

interface CreatePaymentIntentInput {
  merchantId: string;
  amount: number;
  currency: string;
  customerRef?: string;
  metadata?: Record<string, unknown>;
}

interface ConfirmPaymentIntentInput {
  merchantId: string;
  paymentIntentId: string;
  paymentMethodToken: string;
  provider: string;
}

interface CapturePaymentIntentInput {
  merchantId: string;
  paymentIntentId: string;
  amount?: number;
}

interface VoidPaymentIntentInput {
  merchantId: string;
  paymentIntentId: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepository: PrismaPaymentRepository,
    private readonly auditLogRepository: PrismaAuditLogRepository,
    private readonly outboxRepository: PrismaOutboxRepository,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  async createPaymentIntent(input: CreatePaymentIntentInput) {
    if (input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const paymentIntent = await this.paymentRepository.createPaymentIntent({
      merchantId: input.merchantId,
      amount: input.amount,
      currency: input.currency,
      customerRef: input.customerRef,
      metadata: input.metadata
    });

    await this.auditLogRepository.write({
      merchantId: input.merchantId,
      actorType: "merchant",
      action: "payment_intent.created",
      entityType: "payment_intent",
      entityId: paymentIntent.id,
      details: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });

    return paymentIntent;
  }

  async getPaymentIntent(merchantId: string, paymentIntentId: string) {
    const paymentIntent = await this.paymentRepository.getPaymentIntentForMerchant(paymentIntentId, merchantId);
    if (!paymentIntent) {
      throw new NotFoundError("Payment intent not found");
    }

    return paymentIntent;
  }

  async confirmPaymentIntent(input: ConfirmPaymentIntentInput) {
    const paymentIntent = await this.getPaymentIntent(input.merchantId, input.paymentIntentId);
    const processingStatus = transitionPaymentIntent(
      paymentIntent.status as PaymentIntentStatus,
      "confirm_started"
    );

    await this.paymentRepository.updatePaymentIntentStatus(paymentIntent.id, processingStatus);

    const provider = this.providerRegistry.get(input.provider);
    const authorizeResult = await provider.authorize({
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethodToken: input.paymentMethodToken,
      metadata: (paymentIntent.metadata as Record<string, unknown> | null) ?? undefined
    });

    if (!authorizeResult.approved) {
      const failedStatus = transitionPaymentIntent("processing", "authorization_failed");
      await this.paymentRepository.updatePaymentIntentStatus(paymentIntent.id, failedStatus);
      await this.auditLogRepository.write({
        merchantId: input.merchantId,
        actorType: "merchant",
        action: "payment_intent.authorization_failed",
        entityType: "payment_intent",
        entityId: paymentIntent.id,
        details: {
          failureCode: authorizeResult.failureCode ?? "unknown"
        }
      });

      return {
        paymentIntentId: paymentIntent.id,
        status: failedStatus,
        failureCode: authorizeResult.failureCode ?? "unknown"
      };
    }

    const authorizedStatus = transitionPaymentIntent("processing", "authorized");
    const charge = await this.paymentRepository.createCharge({
      paymentIntentId: paymentIntent.id,
      provider: provider.provider,
      providerChargeId: authorizeResult.providerChargeId,
      authorizedAmount: paymentIntent.amount,
      status: "authorized"
    });

    await this.paymentRepository.updatePaymentIntentStatus(paymentIntent.id, authorizedStatus);
    await this.outboxRepository.enqueue({
      eventType: "payment.authorized",
      aggregateType: "payment_intent",
      aggregateId: paymentIntent.id,
      payload: {
        paymentIntentId: paymentIntent.id,
        chargeId: charge.id,
        provider: provider.provider
      }
    });

    await this.auditLogRepository.write({
      merchantId: input.merchantId,
      actorType: "merchant",
      action: "payment_intent.authorized",
      entityType: "payment_intent",
      entityId: paymentIntent.id,
      details: {
        chargeId: charge.id,
        provider: provider.provider
      }
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: authorizedStatus,
      charge
    };
  }

  async capturePaymentIntent(input: CapturePaymentIntentInput) {
    const paymentIntent = await this.getPaymentIntent(input.merchantId, input.paymentIntentId);
    const charge = await this.paymentRepository.getLatestChargeForPaymentIntent(paymentIntent.id);

    if (!charge) {
      throw new NotFoundError("No charge exists for this payment intent");
    }

    const captureAmount = input.amount ?? charge.authorizedAmount - charge.capturedAmount;

    assertCaptureAmount(
      {
        id: charge.id,
        paymentIntentId: charge.paymentIntentId,
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        authorizedAmount: charge.authorizedAmount,
        capturedAmount: charge.capturedAmount,
        status: charge.status as ChargeStatus
      },
      captureAmount
    );

    const provider = this.providerRegistry.get(charge.provider);
    const captureResult = await provider.capture({
      providerChargeId: charge.providerChargeId,
      amount: captureAmount
    });

    const nextChargeStatus = transitionChargeAfterCapture(
      {
        id: charge.id,
        paymentIntentId: charge.paymentIntentId,
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        authorizedAmount: charge.authorizedAmount,
        capturedAmount: charge.capturedAmount,
        status: charge.status as ChargeStatus
      },
      captureAmount
    );

    const updatedCharge = await this.paymentRepository.updateChargeCapture({
      chargeId: charge.id,
      capturedAmount: charge.capturedAmount + captureResult.capturedAmount,
      status: nextChargeStatus
    });

    let paymentIntentStatus: PaymentIntentStatus = paymentIntent.status as PaymentIntentStatus;
    if (captureResult.isFinal || nextChargeStatus === "captured") {
      paymentIntentStatus = transitionPaymentIntent(paymentIntentStatus, "captured");
      await this.paymentRepository.updatePaymentIntentStatus(paymentIntent.id, paymentIntentStatus);
    }

    await this.outboxRepository.enqueue({
      eventType: "payment.captured",
      aggregateType: "payment_intent",
      aggregateId: paymentIntent.id,
      payload: {
        paymentIntentId: paymentIntent.id,
        chargeId: charge.id,
        amount: captureAmount
      }
    });

    await this.auditLogRepository.write({
      merchantId: input.merchantId,
      actorType: "merchant",
      action: "payment_intent.captured",
      entityType: "payment_intent",
      entityId: paymentIntent.id,
      details: {
        chargeId: charge.id,
        captureAmount,
        chargeStatus: updatedCharge.status
      }
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntentStatus,
      charge: updatedCharge
    };
  }

  async voidPaymentIntent(input: VoidPaymentIntentInput) {
    const paymentIntent = await this.getPaymentIntent(input.merchantId, input.paymentIntentId);
    const charge = await this.paymentRepository.getLatestChargeForPaymentIntent(paymentIntent.id);

    if (!charge) {
      throw new NotFoundError("No charge exists for this payment intent");
    }

    assertVoidable({
      id: charge.id,
      paymentIntentId: charge.paymentIntentId,
      provider: charge.provider,
      providerChargeId: charge.providerChargeId,
      authorizedAmount: charge.authorizedAmount,
      capturedAmount: charge.capturedAmount,
      status: charge.status as ChargeStatus
    });

    const provider = this.providerRegistry.get(charge.provider);
    await provider.void({
      providerChargeId: charge.providerChargeId
    });

    await this.paymentRepository.updateChargeStatus(charge.id, "voided");
    const canceledStatus = transitionPaymentIntent(paymentIntent.status as PaymentIntentStatus, "voided");
    await this.paymentRepository.updatePaymentIntentStatus(paymentIntent.id, canceledStatus);

    await this.outboxRepository.enqueue({
      eventType: "payment.voided",
      aggregateType: "payment_intent",
      aggregateId: paymentIntent.id,
      payload: {
        paymentIntentId: paymentIntent.id,
        chargeId: charge.id
      }
    });

    await this.auditLogRepository.write({
      merchantId: input.merchantId,
      actorType: "merchant",
      action: "payment_intent.voided",
      entityType: "payment_intent",
      entityId: paymentIntent.id,
      details: {
        chargeId: charge.id
      }
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: canceledStatus
    };
  }
}
