import { createHmac, randomUUID } from "node:crypto";

import type {
  AuthorizeRequest,
  AuthorizeResult,
  CaptureRequest,
  CaptureResult,
  VoidRequest,
  VoidResult
} from "@payment-gateway/domain";

import type {
  ParseWebhookInput,
  ParsedWebhookEvent,
  ProviderAdapter,
  RefundRequest,
  RefundResult
} from "../../interfaces/providerAdapter.js";

interface MockCharge {
  authorizedAmount: number;
  capturedAmount: number;
  voided: boolean;
}

export class MockProviderAdapter implements ProviderAdapter {
  public readonly provider = "mock";
  private readonly charges = new Map<string, MockCharge>();

  async authorize(request: AuthorizeRequest): Promise<AuthorizeResult> {
    if (request.paymentMethodToken.startsWith("tok_fail")) {
      return {
        approved: false,
        providerChargeId: `mock_ch_${randomUUID()}`,
        failureCode: "card_declined"
      };
    }

    const providerChargeId = `mock_ch_${randomUUID()}`;
    this.charges.set(providerChargeId, {
      authorizedAmount: request.amount,
      capturedAmount: 0,
      voided: false
    });

    return {
      approved: true,
      providerChargeId
    };
  }

  async capture(request: CaptureRequest): Promise<CaptureResult> {
    const charge = this.charges.get(request.providerChargeId);
    if (!charge || charge.voided) {
      throw new Error("Charge not capturable");
    }

    charge.capturedAmount += request.amount;

    return {
      capturedAmount: request.amount,
      isFinal: charge.capturedAmount >= charge.authorizedAmount
    };
  }

  async void(request: VoidRequest): Promise<VoidResult> {
    const charge = this.charges.get(request.providerChargeId);
    if (!charge) {
      throw new Error("Charge not found");
    }

    charge.voided = true;

    return {
      voided: true
    };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    const charge = this.charges.get(request.providerChargeId);
    if (!charge) {
      throw new Error("Charge not found");
    }

    if (request.amount <= 0 || request.amount > charge.capturedAmount) {
      return {
        succeeded: false,
        providerRefundId: `mock_rf_${randomUUID()}`,
        failureCode: "invalid_refund_amount"
      };
    }

    charge.capturedAmount -= request.amount;

    return {
      succeeded: true,
      providerRefundId: `mock_rf_${randomUUID()}`
    };
  }

  async parseWebhook(input: ParseWebhookInput): Promise<ParsedWebhookEvent> {
    const expectedSignature = `sha256=${createHmac("sha256", input.secret).update(input.body).digest("hex")}`;
    if (input.signature !== expectedSignature) {
      throw new Error("Invalid webhook signature");
    }

    const parsed = JSON.parse(input.body) as {
      id: string;
      type: string;
      data: Record<string, unknown>;
    };

    return {
      eventId: parsed.id,
      eventType: parsed.type,
      payload: parsed.data
    };
  }
}

export function signMockWebhookPayload(payload: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
