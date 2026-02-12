import type { CurrencyCode } from "../shared/types.js";

export const paymentIntentStatuses = [
  "requires_confirmation",
  "processing",
  "requires_capture",
  "succeeded",
  "canceled",
  "failed"
] as const;

export type PaymentIntentStatus = (typeof paymentIntentStatuses)[number];

export interface PaymentIntent {
  id: string;
  merchantId: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentIntentStatus;
  customerRef?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export const chargeStatuses = [
  "authorized",
  "partially_captured",
  "captured",
  "voided",
  "failed"
] as const;

export type ChargeStatus = (typeof chargeStatuses)[number];

export interface Charge {
  id: string;
  paymentIntentId: string;
  provider: string;
  providerChargeId: string;
  authorizedAmount: number;
  capturedAmount: number;
  status: ChargeStatus;
}

export interface AuthorizeRequest {
  amount: number;
  currency: CurrencyCode;
  paymentMethodToken: string;
  metadata?: Record<string, unknown>;
}

export interface AuthorizeResult {
  approved: boolean;
  providerChargeId: string;
  failureCode?: string;
}

export interface CaptureRequest {
  providerChargeId: string;
  amount: number;
}

export interface CaptureResult {
  capturedAmount: number;
  isFinal: boolean;
}

export interface VoidRequest {
  providerChargeId: string;
}

export interface VoidResult {
  voided: boolean;
}
