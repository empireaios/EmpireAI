import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Order } from "../../orders/models/order.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import { loadCjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient, canSubmitOrder } from "../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { liveCjFulfillmentTools } from "../../execution/live-cj-fulfillment/tools/live-cj-fulfillment-tools.js";
import { loadLiveCjFulfillmentEnv } from "../../execution/live-cj-fulfillment/config/live-cj-fulfillment-env.js";
import { fetchLiveCjTracking, submitLiveCjOrder } from "../../execution/live-cj-fulfillment/services/cj-live-api-service.js";
import { executeLiveCjSubmit, prepareLiveCjFulfillment, applyFounderApproval } from "../../execution/live-cj-fulfillment/services/live-cj-fulfillment-service.js";
import { recordSubmitFailure, prepareFailureRecovery } from "../../execution/live-cj-fulfillment/services/failure-recovery-service.js";
import { submitProviderOrder, fetchProviderTracking } from "../../execution/live-cj-fulfillment/services/cj-live-provider-adapter.js";
import { createFulfillmentRecord, getLiveCjFulfillmentRepository } from "../../execution/live-cj-fulfillment/repositories/sqlite-live-cj-fulfillment-repository.js";

// Every HTTP response in this suite is an in-memory fixture. No provider access.
const originalEnv = {...process.env};
const originalFetch = globalThis.fetch;
const stamp = "2026-09-20T00:00:00.000Z";
let calls: string[] = [];
let respond: (url: string) => unknown = () => ({});

function order(): Order {
  return {
    orderId: randomUUID(), workspaceId: "ws-truth", storeId: "store-truth", brandId: "brand-truth", connectorId: "cj-truth",
    supplierPlatform: "CJ_DROPSHIPPING", status: "APPROVED", fulfillmentStatus: "PENDING",
    items: [{itemId: "item", supplierSku: "fixture-sku", supplierProductId: "fixture-variant", title: "Fixture", quantity: 1, unitCost: 4, currency: "USD"}],
    shippingAddress: {fullName: "Fixture Person", addressLine1: "1 Fixture Road", city: "Fixture", state: "CA", postalCode: "90001", countryCode: "US", phone: "5550000000"},
    estimatedCost: 4, estimatedDeliveryDaysMin: 1, estimatedDeliveryDaysMax: 7, currency: "USD",
    approval: {approvalToken: "fixture-approval", approvedBy: "fixture-founder", approvedAt: stamp, approved: true},
    supplierOrderId: null, trackingNumber: null, carrier: null, trackingEvents: [], integrationMode: "LIVE", createdAt: stamp, updatedAt: stamp,
  };
}

function approvedFulfillment() {
  return getLiveCjFulfillmentRepository().saveFulfillment(createFulfillmentRecord({
    pipelineId: randomUUID(), workspaceId: "ws-truth", companyId: "co-truth", status: "APPROVED", integrationMode: "LIVE", fulfillmentOrder: order(),
    supplierOrderId: null, trackingNumber: null, carrier: null, founderApprovalToken: "fixture-approval", approvedBy: "fixture-founder", approvedAt: stamp,
    attemptCount: 0, lastErrorMessage: null, lastTrackingSyncAt: null, mock: false, metadata: {},
  }));
}

beforeEach(() => {
  process.env = {...originalEnv, NODE_ENV: "test", DATABASE_PATH: ":memory:", LIVE_CJ_FULFILLMENT_ENABLED: "true", LIVE_CJ_FULFILLMENT_MOCK: "false", CJ_INTEGRATION_MODE: "LIVE", CJ_API_KEY: "fixture-only", CJ_API_BASE_URL: "https://fixture.invalid", CJ_MAX_RETRIES: "0"};
  delete process.env.CJ_DROPSHIPPING_API_KEY;
  clearCjAuthCache();
  calls = [];
  respond = () => ({});
  globalThis.fetch = (async (input) => {
    const url = String(input);
    assert.ok(url.startsWith("https://fixture.invalid/"), "all calls must stay inside fixture adapter");
    calls.push(url);
    if (url.includes("/authentication/")) return Response.json({result: true, data: {accessToken: "fixture-token", accessTokenExpiryDate: "2099-01-01T00:00:00Z"}});
    return Response.json(respond(url));
  }) as typeof fetch;
});
afterEach(() => { process.env = {...originalEnv}; globalThis.fetch = originalFetch; clearCjAuthCache(); });

describe("CJ live receipts fail closed without fabricated success", () => {
  it("missing production credentials block create and tracking without mock fallback", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CJ_API_KEY;
    delete process.env.LIVE_CJ_FULFILLMENT_MOCK;
    assert.equal(loadLiveCjFulfillmentEnv().LIVE_CJ_FULFILLMENT_MOCK, false);
    assert.equal(loadCjConfig().integrationMode, "LIVE");
    await assert.rejects(submitLiveCjOrder(order()), /commerce authority is LOCKED/i);
    await assert.rejects(fetchLiveCjTracking({supplierOrderId: "real-order", trackingNumber: "real-tracking"}), /requires LIVE credentials/i);
    assert.equal(calls.length, 0);
  });
  it("canonical commerce locks override enabled flags and forged token-shaped approval", async () => {
    await assert.rejects(submitLiveCjOrder(order()), /commerce authority is LOCKED/);
    await assert.rejects(fetchLiveCjTracking({supplierOrderId: "provider-order", trackingNumber: "provider-track"}), /commerce authority is LOCKED/);
    const fulfillment = approvedFulfillment();
    await assert.rejects(executeLiveCjSubmit(fulfillment.fulfillmentId), /commerce authority is LOCKED/);
    assert.equal(calls.length, 0);
  });
  it("explicit mock is forbidden in production", () => {
    assert.throws(() => loadLiveCjFulfillmentEnv({NODE_ENV: "production", LIVE_CJ_FULFILLMENT_MOCK: "true"}), /forbidden/);
    for (const marker of ["RAILWAY_ENVIRONMENT", "RAILWAY_ENVIRONMENT_NAME", "RAILWAY_SERVICE_NAME", "RAILWAY_DEPLOYMENT_ID"]) {
      assert.throws(() => loadLiveCjFulfillmentEnv({NODE_ENV: "test", [marker]: "deployed", LIVE_CJ_FULFILLMENT_MOCK: "true"}), /forbidden/);
    }
  });
  it("disabled execution, invalid item/address and missing approval fields never reach HTTP", async () => {
    process.env.LIVE_CJ_FULFILLMENT_ENABLED = "false";
    await assert.rejects(submitLiveCjOrder(order()));
    process.env.LIVE_CJ_FULFILLMENT_ENABLED = "true";
    for (const mutate of [
      (x: Order) => {x.items = [];},
      (x: Order) => {x.items[0]!.quantity = Number.NaN;},
      (x: Order) => {x.shippingAddress.addressLine1 = " ";},
      (x: Order) => {x.approval!.approvalToken = " ";},
      (x: Order) => {x.approval!.approvedAt = "not-a-date";},
    ]) {
      const invalid = order(); mutate(invalid); await assert.rejects(submitLiveCjOrder(invalid));
    }
    assert.equal(calls.length, 0);
  });
  for (const payload of [{}, {result: true, data: {}}, {result: true, data: {orderId: ""}}, {result: true, data: {orderId: 123}}, {result: true, data: {orderId: {bad: true}}}]) {
    it(`missing/malformed provider order receipt stays uncertain: ${JSON.stringify(payload)}`, async () => {
      respond = () => payload;
      await assert.rejects(submitProviderOrder(order(), loadCjConfig(), globalThis.fetch), {name: "LiveCjSubmissionUncertainError"});
      assert.equal(calls.filter((url) => url.includes("createOrder")).length, 1);
    });
  }
  it("valid provider ID is retained exactly and absent tracking stays unknown", async () => {
    respond = () => ({result: true, data: {orderId: "provider-receipt-007"}});
    const result = await submitProviderOrder(order(), loadCjConfig(), globalThis.fetch);
    assert.deepEqual(result, {supplierOrderId: "provider-receipt-007", trackingNumber: null, integrationMode: "LIVE", mock: false});
  });
  it("lost create acknowledgement is never automatically retried and ledger blocks repeat", async () => {
    process.env.CJ_MAX_RETRIES = "3";
    respond = () => {throw new Error("network response lost");};
    const fulfillment = approvedFulfillment();
    // The public path remains locked. Exercise the same adapter error and failure
    // transition without granting real execution authority to this test.
    let uncertain: Error | undefined;
    try {await submitProviderOrder(fulfillment.fulfillmentOrder, loadCjConfig(), globalThis.fetch);} catch (error) {uncertain = error as Error;}
    assert.equal(uncertain?.name, "LiveCjSubmissionUncertainError");
    recordSubmitFailure(fulfillment, uncertain!);
    const saved = getLiveCjFulfillmentRepository().getFulfillmentById(fulfillment.fulfillmentId)!;
    assert.equal(saved.status, "SUBMISSION_UNKNOWN");
    assert.equal(saved.supplierOrderId, null);
    const approval = {fulfillmentId: saved.fulfillmentId, approvalToken: "new", approvedBy: "owner", approvedAt: stamp};
    assert.throws(() => prepareFailureRecovery(approval), /not eligible/);
    assert.throws(() => applyFounderApproval(approval), /cannot receive/);
    assert.equal(prepareLiveCjFulfillment({pipelineId: fulfillment.pipelineId}).fulfillmentId, fulfillment.fulfillmentId);
    await assert.rejects(executeLiveCjSubmit(saved.fulfillmentId), /SUBMISSION_UNKNOWN/);
    assert.equal(calls.filter((url) => url.includes("createOrder")).length, 1);
  });
  it("local save failure after provider acceptance stays uncertain and cannot resubmit", async () => {
    // Explicit local mock tests the post-ack ledger catch path. It is not a
    // provider acceptance test and cannot bypass production commerce locks.
    process.env.LIVE_CJ_FULFILLMENT_MOCK = "true";
    const fulfillment = approvedFulfillment();
    const repository = getLiveCjFulfillmentRepository();
    const originalSave = repository.saveFulfillment;
    let injected = false;
    repository.saveFulfillment = function (record) {
      if (record.status === "SUBMITTED" && !injected) {injected = true; throw new Error("local persistence fault");}
      return originalSave.call(this, record);
    };
    try {
      await assert.rejects(executeLiveCjSubmit(fulfillment.fulfillmentId), {name: "LiveCjSubmissionUncertainError"});
      assert.equal(injected, true);
      assert.equal(repository.getFulfillmentById(fulfillment.fulfillmentId)!.status, "SUBMISSION_UNKNOWN");
      assert.equal(repository.getFulfillmentById(fulfillment.fulfillmentId)!.supplierOrderId, `cj-live-mock-${fulfillment.fulfillmentOrder.orderId}`);
      await assert.rejects(executeLiveCjSubmit(fulfillment.fulfillmentId), /SUBMISSION_UNKNOWN/);
      assert.equal(calls.length, 0);
    } finally {repository.saveFulfillment = originalSave;}
  });
  it("legacy LIVE client blocks rather than manufacture a receipt or bypass ledger", async () => {
    assert.equal(canSubmitOrder(loadCjConfig(), order()), false);
    await assert.rejects(createCjOrderClient().submitOrder(order()), /Legacy live submission/);
    assert.equal(calls.length, 0);
    delete process.env.CJ_API_KEY;
    await assert.rejects(createCjOrderClient().submitOrder(order()), /sandbox substitution is forbidden/);
    assert.equal(calls.length, 0);
  });
});

describe("CJ model tools cannot grant owner authority or cross workspaces", () => {
  const context = {workspaceId: "ws-truth", agentId: "fixture-agent", correlationId: "fixture-correlation"};
  const invoke = (name: string, args: Record<string, unknown>, workspaceId = context.workspaceId) =>
    liveCjFulfillmentTools.find((tool) => tool.name === `live_cj_fulfillment.${name}`)!.handler(args, {...context, workspaceId});
  for (const name of ["apply_founder_approval", "recover_failed"]) {
    it(`${name}: model-supplied token/name/time cannot create authority`, async () => {
      const fulfillment = approvedFulfillment();
      await assert.rejects(invoke(name, {fulfillmentId: fulfillment.fulfillmentId, approvalToken: "model-made-up", approvedBy: "founder", approvedAt: stamp}), /cannot grant founder authority/);
      assert.equal(getLiveCjFulfillmentRepository().getFulfillmentById(fulfillment.fulfillmentId)!.founderApprovalToken, "fixture-approval");
      assert.equal(calls.length, 0);
    });
  }
  for (const name of ["get", "sync_tracking", "submit_live"]) {
    it(`${name}: foreign workspace is denied before effect`, async () => {
      const fulfillment = approvedFulfillment();
      const run = invoke(name, {fulfillmentId: fulfillment.fulfillmentId, markDelivered: true}, "ws-foreign");
      await assert.rejects(run, /unavailable in this tool workspace/);
      assert.equal(getLiveCjFulfillmentRepository().getFulfillmentById(fulfillment.fulfillmentId)!.status, "APPROVED");
      assert.equal(calls.length, 0);
    });
  }
  it("list ignores no authority boundary when supplied another workspace", async () => {
    await assert.rejects(invoke("list", {workspaceId: "ws-foreign"}), /unavailable/);
    await assert.rejects(invoke("prepare", {pipelineId: "missing-foreign-pipeline"}), /unavailable/);
    assert.equal(calls.length, 0);
  });
  it("an approved stored order plus enabled LIVE flags cannot authorize a model submit", async () => {
    const fulfillment = approvedFulfillment();
    await assert.rejects(invoke("submit_live", {fulfillmentId: fulfillment.fulfillmentId}), /cannot authorize live supplier execution/);
    assert.equal(getLiveCjFulfillmentRepository().getFulfillmentById(fulfillment.fulfillmentId)!.status, "APPROVED");
    assert.equal(calls.length, 0);
  });
});

const trackingInput = {supplierOrderId: "provider-order", trackingNumber: "provider-track"};
function trackingProof() {
  return {orderId: trackingInput.supplierOrderId, trackingNumber: trackingInput.trackingNumber, carrier: "Provider Carrier", deliveryStatus: "DELIVERED", events: [{status: "DELIVERED", description: "Provider delivery scan", location: "Destination", occurredAt: stamp}]};
}
describe("CJ tracking never manufactures shipment state", () => {
  for (const [name, change] of [
    ["missing tracking", (x: any) => {delete x.trackingNumber;}],
    ["mismatched tracking", (x: any) => {x.trackingNumber = "someone-else";}],
    ["mismatched order", (x: any) => {x.orderId = "someone-else";}],
    ["missing carrier", (x: any) => {delete x.carrier;}],
    ["undelivered is not delivered", (x: any) => {x.deliveryStatus = "UNDELIVERED";}],
    ["missing scans", (x: any) => {x.events = [];}],
    ["invalid timestamp", (x: any) => {x.events[0].occurredAt = "";}],
    ["missing description", (x: any) => {delete x.events[0].description;}],
    ["unsupported scan status", (x: any) => {x.events[0].status = "UNKNOWN";}],
    ["delivered without delivery scan", (x: any) => {x.events[0].status = "IN_TRANSIT";}],
    ["stale delivery followed by failure", (x: any) => {x.events.push({...x.events[0], status: "FAILED", occurredAt: "2026-09-21T00:00:00Z"});}],
    ["conflicting latest scans", (x: any) => {x.events.push({...x.events[0], status: "IN_TRANSIT"});}],
    ["summary disagrees with delivery scan", (x: any) => {x.deliveryStatus = "IN_TRANSIT";}],
  ] as const) {
    it(`blocks ${name}`, async () => {
      const proof = trackingProof(); change(proof); respond = () => ({result: true, data: proof});
      await assert.rejects(fetchProviderTracking(trackingInput, loadCjConfig(), globalThis.fetch), {name: "LiveCjFulfillmentBlockedError"});
    });
  }
  it("provider error cannot turn into a fake in-transit event", async () => {
    respond = () => {throw new Error("network unavailable");};
    await assert.rejects(fetchProviderTracking(trackingInput, loadCjConfig(), globalThis.fetch), /no transit or delivery event was invented/);
  });
  it("retains a fully supported provider tracking snapshot without adding events", async () => {
    const proof = trackingProof(); respond = () => ({result: true, data: proof});
    const result = await fetchProviderTracking(trackingInput, loadCjConfig(), globalThis.fetch);
    assert.deepEqual(result, {supplierOrderId: trackingInput.supplierOrderId, trackingNumber: proof.trackingNumber, carrier: proof.carrier, deliveryStatus: "DELIVERED", events: proof.events});
  });
});
