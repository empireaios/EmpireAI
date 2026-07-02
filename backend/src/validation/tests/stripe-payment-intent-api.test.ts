import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { createStripePaymentIntent } from "../../revenue/live-payment-engine/services/stripe-payment-service.js";

const ORIGINAL_FETCH = globalThis.fetch;

describe("Stripe PaymentIntent API compatibility (B6-03)", () => {
  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.LIVE_PAYMENT_MOCK;
  });

  it("uses automatic_payment_methods[enabled] for Stripe API 2.0 form encoding", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_b603";
    process.env.LIVE_PAYMENT_MOCK = "false";

    let requestBody = "";
    globalThis.fetch = (async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          id: "pi_test_b603",
          client_secret: "pi_test_b603_secret",
          status: "requires_payment_method",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const result = await createStripePaymentIntent({
      workspaceId: "ws-test",
      companyId: "co-test",
      amountCents: 2500,
      currency: "usd",
    });

    assert.equal(result.mock, false);
    assert.match(requestBody, /automatic_payment_methods%5Benabled%5D=true/);
  });
});
