import { describe, expect, it } from "vitest";

import {
  assertCaptureAmount,
  assertVoidable,
  transitionChargeAfterCapture,
  transitionPaymentIntent
} from "./stateMachine.js";
import type { Charge } from "./types.js";

function buildCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: "ch_1",
    paymentIntentId: "pi_1",
    provider: "mock",
    providerChargeId: "prov_1",
    authorizedAmount: 1000,
    capturedAmount: 0,
    status: "authorized",
    ...overrides
  };
}

describe("payment state machine", () => {
  it("transitions requires_confirmation -> processing", () => {
    expect(transitionPaymentIntent("requires_confirmation", "confirm_started")).toBe("processing");
  });

  it("transitions processing -> requires_capture", () => {
    expect(transitionPaymentIntent("processing", "authorized")).toBe("requires_capture");
  });

  it("transitions requires_capture -> succeeded", () => {
    expect(transitionPaymentIntent("requires_capture", "captured")).toBe("succeeded");
  });

  it("rejects invalid transitions", () => {
    expect(() => transitionPaymentIntent("requires_confirmation", "captured")).toThrow(
      "Invalid payment intent transition"
    );
  });

  it("marks partial capture correctly", () => {
    const charge = buildCharge();
    expect(transitionChargeAfterCapture(charge, 250)).toBe("partially_captured");
  });

  it("marks full capture correctly", () => {
    const charge = buildCharge({ capturedAmount: 500 });
    expect(transitionChargeAfterCapture(charge, 500)).toBe("captured");
  });

  it("validates capture amounts", () => {
    const charge = buildCharge({ capturedAmount: 700 });
    expect(() => assertCaptureAmount(charge, 400)).toThrow("Capture amount exceeds remaining");
  });

  it("validates void status", () => {
    const charge = buildCharge({ status: "captured" });
    expect(() => assertVoidable(charge)).toThrow("Charge cannot be voided");
  });
});
