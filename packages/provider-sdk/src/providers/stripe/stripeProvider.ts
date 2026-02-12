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

export class StripeProviderAdapter implements ProviderAdapter {
  public readonly provider = "stripe";

  async authorize(_request: AuthorizeRequest): Promise<AuthorizeResult> {
    throw new Error("Stripe adapter authorize not implemented");
  }

  async capture(_request: CaptureRequest): Promise<CaptureResult> {
    throw new Error("Stripe adapter capture not implemented");
  }

  async void(_request: VoidRequest): Promise<VoidResult> {
    throw new Error("Stripe adapter void not implemented");
  }

  async refund(_request: RefundRequest): Promise<RefundResult> {
    throw new Error("Stripe adapter refund not implemented");
  }

  async parseWebhook(_input: ParseWebhookInput): Promise<ParsedWebhookEvent> {
    throw new Error("Stripe adapter parseWebhook not implemented");
  }
}
