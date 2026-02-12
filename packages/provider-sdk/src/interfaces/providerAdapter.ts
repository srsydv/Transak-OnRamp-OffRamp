import type {
  AuthorizeRequest,
  AuthorizeResult,
  CaptureRequest,
  CaptureResult,
  VoidRequest,
  VoidResult
} from "@payment-gateway/domain";

export interface RefundRequest {
  providerChargeId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  succeeded: boolean;
  providerRefundId: string;
  failureCode?: string;
}

export interface ParseWebhookInput {
  body: string;
  signature: string;
  secret: string;
}

export interface ParsedWebhookEvent {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface ProviderAdapter {
  readonly provider: string;
  authorize(request: AuthorizeRequest): Promise<AuthorizeResult>;
  capture(request: CaptureRequest): Promise<CaptureResult>;
  void(request: VoidRequest): Promise<VoidResult>;
  refund(request: RefundRequest): Promise<RefundResult>;
  parseWebhook(input: ParseWebhookInput): Promise<ParsedWebhookEvent>;
}
