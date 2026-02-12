import type { Charge, ChargeStatus, PaymentIntentStatus } from "./types.js";

export class PaymentTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentTransitionError";
  }
}

export type PaymentTransitionEvent =
  | "confirm_started"
  | "authorized"
  | "authorization_failed"
  | "captured"
  | "voided";

const transitions: Record<PaymentIntentStatus, Partial<Record<PaymentTransitionEvent, PaymentIntentStatus>>> = {
  requires_confirmation: {
    confirm_started: "processing"
  },
  processing: {
    authorized: "requires_capture",
    authorization_failed: "failed"
  },
  requires_capture: {
    captured: "succeeded",
    voided: "canceled"
  },
  succeeded: {},
  canceled: {},
  failed: {}
};

export function transitionPaymentIntent(
  current: PaymentIntentStatus,
  event: PaymentTransitionEvent
): PaymentIntentStatus {
  const next = transitions[current][event];
  if (!next) {
    throw new PaymentTransitionError(`Invalid payment intent transition: ${current} -> ${event}`);
  }
  return next;
}

export function transitionChargeAfterCapture(charge: Charge, captureAmount: number): ChargeStatus {
  const totalCaptured = charge.capturedAmount + captureAmount;

  if (totalCaptured < charge.authorizedAmount) {
    return "partially_captured";
  }

  return "captured";
}

export function assertCaptureAmount(charge: Charge, captureAmount: number): void {
  if (captureAmount <= 0) {
    throw new PaymentTransitionError("Capture amount must be greater than zero");
  }

  const maxCapturableAmount = charge.authorizedAmount - charge.capturedAmount;
  if (captureAmount > maxCapturableAmount) {
    throw new PaymentTransitionError("Capture amount exceeds remaining authorized amount");
  }

  if (!(charge.status === "authorized" || charge.status === "partially_captured")) {
    throw new PaymentTransitionError(`Charge cannot be captured in status ${charge.status}`);
  }
}

export function assertVoidable(charge: Charge): void {
  if (!(charge.status === "authorized" || charge.status === "partially_captured")) {
    throw new PaymentTransitionError(`Charge cannot be voided in status ${charge.status}`);
  }
}
