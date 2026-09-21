import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import type { Order } from "../../orders/models/order.js";
import { getDatabase } from "../../brain/database.js";
import { loadCjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient } from "../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { CjFulfillmentEstimateUnavailableError, requireCjSandboxEstimate } from "../../suppliers/cj-dropshipping/orders/cj-fulfillment-estimate-gate.js";
import type { CjFulfillmentEstimate } from "../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import { prepareManufacturingFulfillment } from "../../fulfillment/manufacturing-fulfillment-bridge.js";
import { getRevenueLoopRepository } from "../../revenue/minimum-live-revenue-loop/repositories/sqlite-revenue-loop-repository.js";
import { buildMockCheckoutCompletedEvent } from "../../revenue/minimum-live-revenue-loop/services/stripe-client.js";
import { ingestCheckoutCompleted, applyFulfillmentApproval } from "../../revenue/minimum-live-revenue-loop/services/revenue-loop-service.js";
import { createPipelineOrder, startCheckoutPipeline, reservePipelineInventory, applyPipelineApproval } from "../../revenue/customer-order-pipeline/services/customer-order-pipeline-service.js";
import { getCustomerOrderPipelineRepository } from "../../revenue/customer-order-pipeline/repositories/sqlite-customer-order-pipeline-repository.js";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
let outboundCalls = 0;
const stamp = "2026-09-21T00:00:00.000Z";
beforeEach(() => {
  process.env = { ...originalEnv, NODE_ENV: "test", DATABASE_PATH: ":memory:", CJ_INTEGRATION_MODE: "SANDBOX", REVENUE_LOOP_MOCK_PAYMENTS: "true" };
  delete process.env.CJ_API_KEY; delete process.env.CJ_DROPSHIPPING_API_KEY;
  outboundCalls = 0;
  globalThis.fetch = (async () => { outboundCalls++; throw new Error("External traffic forbidden in economics truth tests"); }) as typeof fetch;
});
afterEach(() => { assert.equal(outboundCalls, 0); process.env = { ...originalEnv }; globalThis.fetch = originalFetch; });

function order(): Order {
  return {
    orderId: randomUUID(), workspaceId: "ws-cj-estimate", storeId: "offline-store", brandId: "offline-brand", connectorId: "offline-cj",
    supplierPlatform: "CJ_DROPSHIPPING", status: "READY_FOR_APPROVAL", fulfillmentStatus: "PREPARING",
    items: [{ itemId: "offline-item", supplierSku: "CJ-BLENDER-001", supplierProductId: "cj-sandbox-blender-v1", title: "Offline fixture", quantity: 1, unitCost: 24.99, currency: "USD" }],
    shippingAddress: { fullName: "Offline fixture", addressLine1: "1 Fixture Way", city: "Test", state: "TX", postalCode: "78701", countryCode: "US", phone: "5550000000" },
    estimatedCost: 999, estimatedDeliveryDaysMin: 1, estimatedDeliveryDaysMax: 1, currency: "USD",
    approval: null, supplierOrderId: null, trackingNumber: null, carrier: null, trackingEvents: [],
    integrationMode: "SANDBOX", createdAt: stamp, updatedAt: stamp,
  };
}
function saveStore() {
  const id = randomUUID();
  return getRevenueLoopRepository().saveStore({
    recordId: id, storeId: id, workspaceId: "ws-cj-estimate", companyId: "offline-company", brandId: "offline-brand", slug: id,
    productName: "Offline fixture", productDescription: "No commerce", priceCents: 6000, currency: "USD",
    cjSupplierSku: "CJ-BLENDER-001", cjSupplierProductId: "cj-sandbox-blender-v1", unitCostCents: 2499,
    domain: null, deployPath: "offline-only", status: "DRAFT", analytics: { ga4MeasurementId: "offline", metaPixelId: "offline" }, createdAt: stamp, updatedAt: stamp,
  });
}
const run = { productId: "offline-product", opportunityId: "offline-opportunity", brandId: "offline-brand", storeId: "offline-store", campaignId: "offline-campaign", deploymentRecordId: "offline-deployment", stages: [], runStatus: "COMPLETE" as const, nextActions: [], confidence: 0, signals: [] };

test("all LIVE intent returns unknown cost and timing, with or without credentials", async () => {
  for (const configMode of ["LIVE", "SANDBOX"] as const) for (const orderMode of ["LIVE", "SANDBOX"] as const) for (const key of [undefined, "offline-not-a-credential"]) {
    if (configMode === "SANDBOX" && orderMode === "SANDBOX") continue;
    const input = order(); input.integrationMode = orderMode;
    const client = createCjOrderClient({ config: loadCjConfig({ CJ_INTEGRATION_MODE: configMode, CJ_API_KEY: key }) });
    const estimate = await client.estimateFulfillment(input);
    assert.equal(estimate.source, "UNAVAILABLE"); assert.equal(estimate.valid, false); assert.equal(estimate.liveQuoteVerified, false);
    assert.equal(estimate.estimatedCost, null); assert.equal(estimate.estimatedDeliveryDaysMin, null); assert.equal(estimate.estimatedDeliveryDaysMax, null); assert.equal(estimate.shippingMethod, null);
    assert.match(estimate.issues.join(" "), /no provider quote/);
    assert.throws(() => requireCjSandboxEstimate(estimate), CjFulfillmentEstimateUnavailableError);
    assert.equal(JSON.parse(JSON.stringify(estimate)).estimatedCost, null);
  }
});

test("known offline fixture is explicitly sandbox and never verified live economics", async () => {
  const estimate = await createCjOrderClient().estimateFulfillment(order());
  requireCjSandboxEstimate(estimate);
  assert.equal(estimate.source, "SANDBOX_FIXTURE"); assert.equal(estimate.liveQuoteVerified, false);
  assert.equal(estimate.estimatedCost, 30.98); assert.equal(estimate.shippingMethod, "CJ_STANDARD_SANDBOX");
  assert.equal(estimate.estimatedDeliveryDaysMin, 7); assert.equal(estimate.estimatedDeliveryDaysMax, 14);
});

test("invalid item economics or currency do not produce a numeric estimate", async () => {
  const mutations = [
    (x: Order) => { x.items[0]!.unitCost = NaN; }, (x: Order) => { x.items[0]!.unitCost = Infinity; },
    (x: Order) => { x.items[0]!.unitCost = -1; }, (x: Order) => { x.items[0]!.unitCost = 1e308; }, (x: Order) => { x.items[0]!.unitCost = Number.MAX_SAFE_INTEGER; }, (x: Order) => { x.items[0]!.quantity = 0; },
    (x: Order) => { x.items[0]!.quantity = 1.5; }, (x: Order) => { x.items[0]!.currency = "EUR"; },
    (x: Order) => { x.currency = ""; }, (x: Order) => { x.items = []; },
  ];
  for (const change of mutations) {
    const input = order(); change(input); const estimate = await createCjOrderClient().estimateFulfillment(input);
    assert.equal(estimate.estimatedCost, null); assert.equal(estimate.valid, false);
    assert.throws(() => requireCjSandboxEstimate(estimate), CjFulfillmentEstimateUnavailableError);
  }
});

test("consumer guard rejects null-as-zero, invalid fixtures and forged numeric status", async () => {
  const known = await createCjOrderClient().estimateFulfillment(order());
  for (const malformed of [{ ...known, estimatedCost: null }, { ...known, estimatedCost: NaN }, { ...known, estimatedCost: 1e308 }, { ...known, estimatedCost: Number.MAX_SAFE_INTEGER }, { ...known, valid: false }, { ...known, estimatedDeliveryDaysMax: -1 }, { ...known, source: "UNAVAILABLE" }]) {
    assert.throws(() => requireCjSandboxEstimate(malformed as CjFulfillmentEstimate), CjFulfillmentEstimateUnavailableError);
  }
});

test("manufacturing preparation cannot turn missing LIVE quote into ready or numeric costs", async () => {
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  await assert.rejects(prepareManufacturingFulfillment({ run, workspaceId: "ws-cj-estimate" }), (error: unknown) => {
    assert.ok(error instanceof CjFulfillmentEstimateUnavailableError); assert.equal(error.estimate.estimatedCost, null); return true;
  });
});

test("LIVE checkout cannot mint supplier expenses, profitable orders or approvals from missing quote", async () => {
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  const store = saveStore(); const sessionId = `offline-${randomUUID()}`;
  const event = buildMockCheckoutCompletedEvent(sessionId, { storeId: store.storeId, amountTotal: "6000", currency: "usd" });
  await assert.rejects(ingestCheckoutCompleted({ event }), CjFulfillmentEstimateUnavailableError);
  assert.equal(getRevenueLoopRepository().getOrderByStripeSession(sessionId), null);
  const ledger = getDatabase().prepare("SELECT event_type FROM financial_ledger_events WHERE correlation_id = @id").all({ id: sessionId });
  assert.deepEqual(ledger, []);
});

test("LIVE customer pipeline cannot save an order with invented cost or delivery promises", async () => {
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  const store = saveStore();
  const pipeline = startCheckoutPipeline({ workspaceId: store.workspaceId, companyId: store.companyId, storeId: store.storeId, brandId: store.brandId, customerEmail: "offline@example.invalid", customerName: "Offline fixture", revenueCents: 6000, currency: "USD", correlationId: randomUUID() });
  await assert.rejects(createPipelineOrder(pipeline.pipelineId), CjFulfillmentEstimateUnavailableError);
  const saved = getCustomerOrderPipelineRepository().getPipelineById(pipeline.pipelineId)!;
  assert.equal(saved.fulfillmentOrder, null); assert.equal(saved.status, "CHECKOUT_CREATED");
});

test("valid sandbox preparation and checkout simulations remain available without network", async () => {
  const prepared = await prepareManufacturingFulfillment({ run, workspaceId: "ws-cj-estimate" });
  assert.equal(prepared.fulfillmentReadiness.ready, true); assert.equal(prepared.draftOrder.integrationMode, "SANDBOX");
  const store = saveStore();
  const record = await ingestCheckoutCompleted({ event: buildMockCheckoutCompletedEvent(`offline-${randomUUID()}`, { storeId: store.storeId, amountTotal: "6000", currency: "usd" }) });
  assert.equal(record.fulfillmentOrder?.integrationMode, "SANDBOX"); assert.equal(record.fulfillmentOrder?.estimatedCost, 30.98);
});


test("production and deployed contexts cannot silently default to sandbox quote economics", async () => {
  for (const marker of ["NODE_ENV", "RAILWAY_ENVIRONMENT", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_SERVICE_NAME", "RAILWAY_DEPLOYMENT_ID", "VERCEL"]) {
    const previous = process.env[marker]; process.env[marker] = marker === "NODE_ENV" ? "production" : "deployed";
    try { assert.equal((await createCjOrderClient().estimateFulfillment(order())).estimatedCost, null); }
    finally { if (previous === undefined) delete process.env[marker]; else process.env[marker] = previous; }
  }
});

test("previous sandbox revenue guesses cannot be reused or approved after switching LIVE", async () => {
  const store = saveStore(); const event = buildMockCheckoutCompletedEvent(`offline-${randomUUID()}`, { storeId: store.storeId, amountTotal: "6000", currency: "usd" });
  const record = await ingestCheckoutCompleted({ event });
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  await assert.rejects(ingestCheckoutCompleted({ event }), CjFulfillmentEstimateUnavailableError);
  assert.throws(() => applyFulfillmentApproval({ recordId: record.recordId, approvalToken: "offline", approvedBy: "offline", approvedAt: stamp }), CjFulfillmentEstimateUnavailableError);
  assert.equal(getRevenueLoopRepository().getOrderById(record.recordId)!.status, "AWAITING_FULFILLMENT_APPROVAL");
});

test("cached pipeline order cannot promote old sandbox economics into LIVE reservation or approval", async () => {
  const store = saveStore();
  const pipeline = startCheckoutPipeline({ workspaceId: store.workspaceId, companyId: store.companyId, storeId: store.storeId, brandId: store.brandId, customerEmail: "offline@example.invalid", customerName: "Offline fixture", revenueCents: 6000, correlationId: randomUUID() });
  const prepared = await createPipelineOrder(pipeline.pipelineId);
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  await assert.rejects(createPipelineOrder(pipeline.pipelineId), CjFulfillmentEstimateUnavailableError);
  assert.throws(() => reservePipelineInventory(pipeline.pipelineId), CjFulfillmentEstimateUnavailableError);
  getCustomerOrderPipelineRepository().savePipeline({ ...prepared, status: "AWAITING_FULFILLMENT_APPROVAL" });
  assert.throws(() => applyPipelineApproval({ pipelineId: pipeline.pipelineId, approvalToken: "offline", approvedBy: "offline", approvedAt: stamp }), CjFulfillmentEstimateUnavailableError);
  assert.equal(getCustomerOrderPipelineRepository().getPipelineById(pipeline.pipelineId)!.fulfillmentOrder!.status, "READY_FOR_APPROVAL");
});


test("historical revenue without fulfillment context cannot reuse a guessed numeric profit", async () => {
  const store = saveStore(); const event = buildMockCheckoutCompletedEvent(`offline-${randomUUID()}`, { storeId: store.storeId, amountTotal: "6000", currency: "usd" });
  const record = await ingestCheckoutCompleted({ event });
  getRevenueLoopRepository().saveOrder({ ...record, fulfillmentOrder: null });
  process.env.CJ_INTEGRATION_MODE = "LIVE";
  await assert.rejects(ingestCheckoutCompleted({ event }), CjFulfillmentEstimateUnavailableError);
  assert.equal(getRevenueLoopRepository().getOrderById(record.recordId)!.fulfillmentOrder, null);
  assert.equal(getRevenueLoopRepository().getOrderById(record.recordId)!.status, "AWAITING_FULFILLMENT_APPROVAL");
});
