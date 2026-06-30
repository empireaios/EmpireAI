import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { livePaymentTools } from "../../revenue/live-payment-engine/tools/live-payment-tools.js";
import {
  completeMockCheckout,
  completeMockPaymentIntent,
  createLiveCheckout,
  createLivePaymentIntent,
  getRevenueSummary,
  processStripeWebhookEvent,
  PAYPAL_ARCHITECTURE_BLUEPRINT,
} from "../../revenue/live-payment-engine/index.js";
import {
  buildMockCheckoutCompletedEvent,
  buildMockPaymentIntentSucceededEvent,
} from "../../revenue/live-payment-engine/services/stripe-payment-service.js";
import type { ToolContext } from "../../brain/types.js";
import { getDatabase } from "../../brain/database.js";

const WORKSPACE_ID = "ws-m103";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "live-payments",
    correlationId: "corr-m103",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = livePaymentTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.LIVE_PAYMENT_MOCK = "true";
  process.env.LIVE_PAYMENT_ENABLED = "false";
  process.env.LIVE_PAYMENT_STORE_BASE_URL = "http://localhost:4000";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Mission 103 Live Payment Engine", () => {
  it("registers nine live payment Brain tools", () => {
    assert.equal(livePaymentTools.length, 9);
    assert.ok(livePaymentTools.some((tool) => tool.name === "live_payment.create_checkout"));
    assert.ok(livePaymentTools.some((tool) => tool.name === "live_payment.get_paypal_architecture"));
  });

  it("creates mock Stripe Checkout session when Stripe is not configured", async () => {
    const result = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      productName: "Grand King Premium Bundle",
      amountCents: 7500,
    });

    assert.equal(result.mock, true);
    assert.match(result.sessionId, /^cs_mock_/);
    assert.equal(result.payment.status, "PENDING");
    assert.equal(result.payment.amountCents, 7500);
  });

  it("creates mock PaymentIntent when Stripe is not configured", async () => {
    const result = await createLivePaymentIntent({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 3200,
      description: "Direct card payment test",
    });

    assert.equal(result.mock, true);
    assert.match(result.paymentIntentId, /^pi_mock_/);
    assert.ok(result.clientSecret);
    assert.equal(result.payment.method, "PAYMENT_INTENT");
  });

  it("records real sale in ledger via mock checkout webhook", async () => {
    const sessionId = "cs_mock_ledger_test_m103";
    const payment = await completeMockCheckout({
      sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 9900,
      productName: "Ledger Test Product",
    });

    assert.equal(payment.status, "SUCCEEDED");
    assert.ok(payment.ledgerSaleEventId);
    assert.ok(payment.ledgerFeeEventId);

    const db = getDatabase();
    const saleRow = db
      .prepare(
        `SELECT event_type, amount_cents, source FROM financial_ledger_events
         WHERE correlation_id = @cid AND event_type = 'sale'`,
      )
      .get({ cid: sessionId }) as { event_type: string; amount_cents: number; source: string };

    assert.equal(saleRow.event_type, "sale");
    assert.equal(saleRow.amount_cents, 9900);
    assert.equal(saleRow.source, "live_payment_engine");
  });

  it("records real sale via PaymentIntent webhook", async () => {
    const paymentIntentId = "pi_mock_intent_m103";
    const payment = await completeMockPaymentIntent({
      paymentIntentId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 4500,
    });

    assert.equal(payment.status, "SUCCEEDED");
    assert.equal(payment.stripePaymentIntentId, paymentIntentId);
    assert.ok(payment.ledgerSaleEventId);
  });

  it("processes webhook events idempotently", async () => {
    const event = buildMockCheckoutCompletedEvent("cs_mock_idempotent_m103", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountTotal: "2500",
      currency: "usd",
    });

    const first = await processStripeWebhookEvent(event);
    const second = await processStripeWebhookEvent(event);

    assert.ok(first.payment);
    assert.equal(first.skipped, false);
    assert.equal(second.skipped, true);
    assert.equal(second.payment, null);
  });

  it("returns real revenue summary from succeeded payments", async () => {
    await completeMockCheckout({
      sessionId: "cs_mock_revenue_a",
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 5000,
    });
    await completeMockCheckout({
      sessionId: "cs_mock_revenue_b",
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 3000,
    });

    const summary = getRevenueSummary(WORKSPACE_ID, COMPANY_ID);

    assert.ok(summary.succeededPayments >= 2);
    assert.ok(summary.totalRevenueCents >= 8000);
    assert.ok(summary.ledgerRevenueCents >= 8000);
    assert.equal(summary.ledgerSaleCount, summary.succeededPayments);
  });

  it("exposes PayPal architecture blueprint only (not implemented)", async () => {
    const result = (await invokeTool("live_payment.get_paypal_architecture")) as {
      blueprint: typeof PAYPAL_ARCHITECTURE_BLUEPRINT;
    };

    assert.equal(result.blueprint.status, "ARCHITECTURE_ONLY");
    assert.equal(result.blueprint.capabilities.checkout, "PLANNED");
    assert.equal(result.blueprint.implementationPhase, "M104_OR_LATER");
  });

  it("lists payments via Brain tool after checkout creation", async () => {
    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      productName: "List Test Product",
      amountCents: 1999,
    });

    await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 1999,
    });

    const listed = (await invokeTool("live_payment.list_payments", {
      companyId: COMPANY_ID,
    })) as { payments: Array<{ paymentId: string; status: string }> };

    assert.ok(listed.payments.length >= 1);
    assert.ok(listed.payments.some((payment) => payment.status === "SUCCEEDED"));
  });

  it("processes payment_intent.succeeded via process_webhook tool", async () => {
    const intent = await createLivePaymentIntent({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 6100,
    });

    const event = buildMockPaymentIntentSucceededEvent(intent.paymentIntentId, {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountTotal: "6100",
      currency: "usd",
    });

    const result = await processStripeWebhookEvent(event);
    assert.ok(result.payment);
    assert.equal(result.payment?.status, "SUCCEEDED");
    assert.equal(result.payment?.amountCents, 6100);
  });
});
