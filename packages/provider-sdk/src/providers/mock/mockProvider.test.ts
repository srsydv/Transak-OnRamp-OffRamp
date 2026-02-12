import { describe, expect, it } from "vitest";

import { MockProviderAdapter, signMockWebhookPayload } from "./mockProvider.js";

describe("MockProviderAdapter", () => {
  it("authorizes and captures a charge", async () => {
    const adapter = new MockProviderAdapter();
    const auth = await adapter.authorize({
      amount: 1000,
      currency: "USD",
      paymentMethodToken: "tok_visa"
    });

    expect(auth.approved).toBe(true);

    const capture = await adapter.capture({
      providerChargeId: auth.providerChargeId,
      amount: 1000
    });

    expect(capture.isFinal).toBe(true);
    expect(capture.capturedAmount).toBe(1000);
  });

  it("validates webhook signatures", async () => {
    const adapter = new MockProviderAdapter();
    const payload = JSON.stringify({ id: "evt_1", type: "payment.captured", data: { id: "ch_1" } });
    const signature = signMockWebhookPayload(payload, "secret");

    const parsed = await adapter.parseWebhook({
      body: payload,
      signature,
      secret: "secret"
    });

    expect(parsed.eventId).toBe("evt_1");
    expect(parsed.eventType).toBe("payment.captured");
  });

  it("rejects invalid signatures", async () => {
    const adapter = new MockProviderAdapter();

    await expect(
      adapter.parseWebhook({
        body: JSON.stringify({ id: "evt_1", type: "payment.captured", data: {} }),
        signature: "sha256=invalid",
        secret: "secret"
      })
    ).rejects.toThrow("Invalid webhook signature");
  });
});
