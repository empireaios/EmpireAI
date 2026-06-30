import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  applyOrderApproval,
  prepareManufacturingFulfillment,
} from "../../fulfillment/index.js";
import {
  DEFAULT_M072_IDS,
  runAutonomousCompanyManufacturingLoop,
} from "../../execution/autonomous-company-manufacturing-loop/index.js";
import {
  ORDER_STATUSES,
  isOrderApproved,
  validateOrder as validateDomainOrder,
} from "../../orders/index.js";
import {
  buildOrderPayload,
  createCjOrderClient,
  evaluateFulfillmentHealth,
  resetFulfillmentHealthTelemetry,
  syncSandboxTracking,
  applyTrackingSync,
  CjOrderApprovalRequiredError,
  CJ_ORDER_ENDPOINTS,
} from "../../suppliers/cj-dropshipping/orders/index.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/index.js";

const WORKSPACE_ID = "ws-m075";

const ORIGINAL_ENV = { ...process.env };

function buildApprovedOrder(base: Awaited<ReturnType<typeof prepareManufacturingFulfillment>>["draftOrder"]) {
  return applyOrderApproval(base, {
    approvalToken: "approval-token-m075",
    approvedBy: "founder@empireai.test",
    approvedAt: new Date().toISOString(),
    approved: true,
  });
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearCjAuthCache();
  resetFulfillmentHealthTelemetry();
});

describe("Mission 075 CJ Order Fulfillment Automation", () => {
  it("defines the full order lifecycle status enum", () => {
    assert.deepEqual(ORDER_STATUSES, [
      "DRAFT",
      "READY_FOR_APPROVAL",
      "APPROVED",
      "SUBMITTED",
      "FULFILLED",
      "DELIVERED",
      "FAILED",
      "CANCELLED",
    ]);
  });

  it("builds CJ order payload from a draft order without submitting", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });
    const preparation = await prepareManufacturingFulfillment({
      run,
      workspaceId: WORKSPACE_ID,
    });

    const payload = buildOrderPayload(preparation.draftOrder);

    assert.equal(payload.orderNumber, preparation.draftOrder.orderId);
    assert.equal(payload.sandbox, true);
    assert.ok(payload.products.length >= 1);
    assert.ok(payload.shippingCustomerName.length > 0);
    assert.equal(preparation.autoSubmitEnabled, false);
    assert.equal(preparation.fulfillmentReadiness.submissionAllowed, false);
  });

  it("prepares M072 manufacturing fulfillment without live submission", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });
    const preparation = await prepareManufacturingFulfillment({
      run,
      workspaceId: WORKSPACE_ID,
    });

    assert.equal(preparation.runId, `mfg-${run.productId}`);
    assert.equal(preparation.draftOrder.status, "READY_FOR_APPROVAL");
    assert.equal(preparation.draftOrder.integrationMode, "SANDBOX");
    assert.ok(preparation.estimatedCost > 0);
    assert.ok(preparation.estimatedDeliveryDaysMin >= 5);
    assert.ok(preparation.supplierValidation.valid);
    assert.equal(preparation.fulfillmentReadiness.ready, true);
    assert.equal(preparation.autoSubmitEnabled, false);
  });

  it("blocks submitOrder without approval gate", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });
    const preparation = await prepareManufacturingFulfillment({
      run,
      workspaceId: WORKSPACE_ID,
    });
    const client = createCjOrderClient();

    await assert.rejects(
      () => client.submitOrder(preparation.draftOrder),
      (error: unknown) => error instanceof CjOrderApprovalRequiredError,
    );
  });

  it("submits sandbox order only when APPROVED with approval gate fields", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });
    const preparation = await prepareManufacturingFulfillment({
      run,
      workspaceId: WORKSPACE_ID,
    });
    const approvedOrder = buildApprovedOrder(preparation.draftOrder);
    assert.equal(isOrderApproved(approvedOrder), true);

    const client = createCjOrderClient();
    const result = await client.submitOrder(approvedOrder);

    assert.equal(result.integrationMode, "SANDBOX");
    assert.equal(result.status, "SANDBOX_SIMULATED");
    assert.ok(result.supplierOrderId.startsWith("cj-sandbox-order-"));
  });

  it("synchronizes tracking number, carrier, delivery status, and shipment events", () => {
    const orderId = "ord-m075-tracking";
    const sync = syncSandboxTracking({ orderId }, "cj-sandbox-order-001", "TRK-M075001");

    assert.equal(sync.trackingNumber, "TRK-M075001");
    assert.equal(sync.carrier, "CJ_SANDBOX_LOGISTICS");
    assert.equal(sync.deliveryStatus, "IN_TRANSIT");
    assert.ok(sync.events.length >= 2);
    assert.ok(sync.events.every((event) => event.trackingNumber === "TRK-M075001"));

    const baseOrder = {
      orderId,
      workspaceId: WORKSPACE_ID,
      storeId: "store-1",
      brandId: "brand-1",
      supplierPlatform: "CJ_DROPSHIPPING" as const,
      connectorId: "cj-default",
      status: "SUBMITTED" as const,
      fulfillmentStatus: "SUBMITTED" as const,
      items: [],
      shippingAddress: {
        fullName: "Test",
        addressLine1: "1 Main",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        countryCode: "US",
        phone: "555-0100",
      },
      estimatedCost: 30,
      estimatedDeliveryDaysMin: 7,
      estimatedDeliveryDaysMax: 14,
      currency: "USD",
      approval: null,
      supplierOrderId: "cj-sandbox-order-001",
      trackingNumber: null,
      carrier: null,
      trackingEvents: [],
      integrationMode: "SANDBOX" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = applyTrackingSync(baseOrder, sync);
    assert.equal(updated.trackingNumber, "TRK-M075001");
    assert.equal(updated.carrier, "CJ_SANDBOX_LOGISTICS");
    assert.equal(updated.trackingEvents.length, sync.events.length);
  });

  it("evaluates fulfillment health tiers from telemetry", () => {
    resetFulfillmentHealthTelemetry();

    const healthy = evaluateFulfillmentHealth();
    assert.equal(healthy.tier, "HEALTHY");

    const degraded = evaluateFulfillmentHealth({
      submissionAttempts: 10,
      submissionSuccesses: 7,
      fulfillmentSuccesses: 6,
      deliverySuccesses: 4,
      failures: 3,
    });
    assert.equal(degraded.tier, "DEGRADED");

    const failed = evaluateFulfillmentHealth({
      submissionAttempts: 10,
      submissionSuccesses: 3,
      fulfillmentSuccesses: 2,
      deliverySuccesses: 1,
      failures: 8,
    });
    assert.equal(failed.tier, "FAILED");
  });

  it("defaults to SANDBOX and exposes CJ order endpoints without modifying M074 catalog sync", () => {
    delete process.env.CJ_INTEGRATION_MODE;
    delete process.env.CJ_API_KEY;
    delete process.env.CJ_API_SECRET;

    const client = createCjOrderClient();
    assert.equal(client.config.integrationMode, "SANDBOX");
    assert.equal(CJ_ORDER_ENDPOINTS.ORDER_CREATE, "/shopping/order/createOrder");
    assert.equal(CJ_ORDER_ENDPOINTS.ORDER_TRACKING, "/logistic/trackInfo");
  });

  it("validates domain order schema for approval-gated fulfillment records", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });
    const preparation = await prepareManufacturingFulfillment({
      run,
      workspaceId: WORKSPACE_ID,
    });

    const validated = validateDomainOrder(preparation.draftOrder);
    assert.equal(validated.supplierPlatform, "CJ_DROPSHIPPING");
    assert.equal(validated.approval, null);
  });
});
