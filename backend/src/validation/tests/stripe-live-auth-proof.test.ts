import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { runStripeLiveAuthProof } from "../../revenue/shared/stripe-live-auth-proof.js";

describe("Stripe live auth proof (B6-03B)", () => {
  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.LIVE_PAYMENT_MOCK;
  });

  it("reports missing credentials without exposing secrets", async () => {
    const proof = await runStripeLiveAuthProof({});
    assert.equal(proof.certification, "FAIL");
    assert.equal(proof.credentials.secretKeyPresent, false);
    assert.equal(proof.credentials.webhookSecretPresent, false);
    assert.ok(proof.blockers.some((b) => b.includes("STRIPE_SECRET_KEY")));
  });

  it("passes when Stripe API, signature verification, and webhook endpoint succeed", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_b603b_proof";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_b603b_proof_secret";
    process.env.LIVE_PAYMENT_MOCK = "false";
    process.env.PORT = "4000";
    process.env.HOST = "127.0.0.1";

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("api.stripe.com/v1/balance")) {
        return new Response(JSON.stringify({ livemode: true, object: "balance" }), { status: 200 });
      }
      if (url.includes("/live-payments/webhooks/stripe")) {
        return new Response(JSON.stringify({ received: true, skipped: false }), { status: 200 });
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const proof = await runStripeLiveAuthProof(process.env, fetchImpl);
    assert.equal(proof.certification, "PASS");
    assert.equal(proof.credentials.secretKeyMode, "live");
    assert.equal(proof.stripeApi.accountAccessible, true);
    assert.equal(proof.webhookVerification.signatureRoundTripVerified, true);
    assert.equal(proof.webhookVerification.staleSignatureRejected, true);
    assert.equal(proof.paymentService.stripeLiveConfigured, true);
    assert.equal(proof.webhookEndpoint.acceptsSignedPayload, true);
  });
});
