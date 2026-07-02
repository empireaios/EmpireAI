import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";

import { verifyStripeWebhookSignature } from "../../revenue/shared/stripe-webhook-verification.js";

const WEBHOOK_SECRET = "whsec_test_secret_for_b6_03";

function buildSignatureHeader(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${ts},v1=${signature}`;
}

describe("Stripe webhook verification (B6-03 compatibility)", () => {
  it("accepts valid signatures within tolerance", () => {
    const payload = JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test" } },
    });
    const rawBody = Buffer.from(payload, "utf8");
    const header = buildSignatureHeader(payload, WEBHOOK_SECRET);

    const event = verifyStripeWebhookSignature(rawBody, header, WEBHOOK_SECRET);
    assert.equal(event.id, "evt_test_123");
    assert.equal(event.type, "checkout.session.completed");
  });

  it("rejects stale webhook timestamps", () => {
    const payload = JSON.stringify({ id: "evt_stale", type: "ping", data: { object: {} } });
    const rawBody = Buffer.from(payload, "utf8");
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600;
    const header = buildSignatureHeader(payload, WEBHOOK_SECRET, staleTimestamp);

    assert.throws(
      () => verifyStripeWebhookSignature(rawBody, header, WEBHOOK_SECRET),
      /timestamp outside tolerance/,
    );
  });

  it("rejects invalid signatures", () => {
    const payload = JSON.stringify({ id: "evt_bad", type: "ping", data: { object: {} } });
    const rawBody = Buffer.from(payload, "utf8");
    const header = buildSignatureHeader(payload, "whsec_wrong_secret");

    assert.throws(
      () => verifyStripeWebhookSignature(rawBody, header, WEBHOOK_SECRET),
      /signature verification failed/,
    );
  });
});
