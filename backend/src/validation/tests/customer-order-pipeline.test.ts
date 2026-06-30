import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { customerOrderPipelineTools } from "../../revenue/customer-order-pipeline/tools/customer-order-pipeline-tools.js";
import {
  CustomerOrderPipelineBlockedError,
  getPipelineStageIndex,
  ingestVerifiedPayment,
  runSandboxFulfillmentCycle,
  startCheckoutPipeline,
  submitPipelineFulfillment,
} from "../../revenue/customer-order-pipeline/index.js";
import {
  completeMockCheckout,
  createLiveCheckout,
} from "../../revenue/live-payment-engine/index.js";
import { deployLiveStore } from "../../revenue/minimum-live-revenue-loop/index.js";
import type { ToolContext } from "../../brain/types.js";
import { getDatabase } from "../../brain/database.js";

const WORKSPACE_ID = "ws-m104";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "customer-orders",
    correlationId: "corr-m104",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = customerOrderPipelineTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m104-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.LIVE_PAYMENT_MOCK = "true";
  process.env.LIVE_PAYMENT_ENABLED = "false";
  process.env.CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED = "false";
  delete process.env.STRIPE_SECRET_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 104 Customer Order Pipeline", () => {
  it("registers nine customer order Brain tools", () => {
    assert.equal(customerOrderPipelineTools.length, 9);
    assert.ok(
      customerOrderPipelineTools.some((tool) => tool.name === "customer_order.ingest_payment"),
    );
  });

  it("starts pipeline at CHECKOUT_CREATED", () => {
    const correlationId = `checkout-${randomUUID()}`;
    const pipeline = startCheckoutPipeline({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: "store-test",
      brandId: "brand-gk",
      customerEmail: "customer@grandkings.account",
      customerName: "Grand King Customer",
      revenueCents: 4999,
      correlationId,
    });

    assert.equal(pipeline.status, "CHECKOUT_CREATED");
    assert.equal(pipeline.correlationId, correlationId);
  });

  it("ingests verified payment through order creation and inventory reservation", async () => {
    const slug = uniqueSlug("payment-ingest");
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandId: "brand-gk",
      slug,
      productName: "Pipeline Product",
      productDescription: "Full lifecycle test",
      priceCents: 5500,
      cjSupplierSku: "CJ-SKU-M104",
      cjSupplierProductId: "CJ-PID-M104",
      unitCostCents: 1500,
    });

    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      productName: deployed.store.productName,
      amountCents: 5500,
    });

    const payment = await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 5500,
      storeId: deployed.store.storeId,
    });

    const pipeline = await ingestVerifiedPayment(payment.paymentId);

    assert.equal(pipeline.status, "AWAITING_FULFILLMENT_APPROVAL");
    assert.ok(pipeline.paymentId);
    assert.ok(pipeline.fulfillmentOrder);
    assert.ok(pipeline.inventoryReservationId);
    assert.equal(pipeline.storeId, deployed.store.storeId);
  });

  it("runs full sandbox lifecycle through DELIVERED with ledger update", async () => {
    const slug = uniqueSlug("full-cycle");
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandId: "brand-gk",
      slug,
      productName: "Delivered Product",
      productDescription: "End-to-end test",
      priceCents: 6200,
      cjSupplierSku: "CJ-SKU-DELIVER",
      cjSupplierProductId: "CJ-PID-DELIVER",
      unitCostCents: 1800,
    });

    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      productName: deployed.store.productName,
      amountCents: 6200,
    });

    const payment = await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 6200,
      storeId: deployed.store.storeId,
    });

    const ingested = await ingestVerifiedPayment(payment.paymentId);
    const delivered = await runSandboxFulfillmentCycle({
      pipelineId: ingested.pipelineId,
      approvalToken: "founder-approve-m104",
      approvedBy: "founder@empireai.com",
    });

    assert.equal(delivered.status, "DELIVERED");
    assert.ok(delivered.supplierOrderId);
    assert.ok(delivered.trackingNumber);
    assert.ok(delivered.ledgerDeliveryEventId);
    assert.equal(delivered.fulfillmentOrder?.status, "DELIVERED");

    const db = getDatabase();
    const shippingRow = db
      .prepare(
        `SELECT event_type FROM financial_ledger_events
         WHERE correlation_id = @cid AND event_type = 'shipping'`,
      )
      .get({ cid: `${delivered.correlationId}:shipping` }) as { event_type: string } | undefined;
    assert.equal(shippingRow?.event_type, "shipping");
  });

  it("advances pipeline stages in correct order", async () => {
    const slug = uniqueSlug("stages");
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandId: "brand-gk",
      slug,
      productName: "Stage Product",
      productDescription: "Stage test",
      priceCents: 4000,
      cjSupplierSku: "CJ-SKU-STAGE",
      cjSupplierProductId: "CJ-PID-STAGE",
      unitCostCents: 1200,
    });

    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      productName: deployed.store.productName,
      amountCents: 4000,
    });

    const payment = await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 4000,
      storeId: deployed.store.storeId,
    });

    const pipeline = await ingestVerifiedPayment(payment.paymentId);
    assert.ok(getPipelineStageIndex(pipeline.status) >= getPipelineStageIndex("ORDER_CREATED"));
    assert.ok(getPipelineStageIndex(pipeline.status) >= getPipelineStageIndex("INVENTORY_RESERVED"));
  });

  it("blocks live fulfillment when Protect The Empire gate is disabled", async () => {
    const slug = uniqueSlug("live-block");
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandId: "brand-gk",
      slug,
      productName: "Block Product",
      productDescription: "Live gate test",
      priceCents: 5000,
      cjSupplierSku: "CJ-SKU-BLOCK",
      cjSupplierProductId: "CJ-PID-BLOCK",
      unitCostCents: 1400,
    });

    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      productName: deployed.store.productName,
      amountCents: 5000,
    });

    const payment = await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 5000,
      storeId: deployed.store.storeId,
    });

    const pipeline = await ingestVerifiedPayment(payment.paymentId);

    await invokeTool("customer_order.apply_approval", {
      pipelineId: pipeline.pipelineId,
      approvalToken: "token-block",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    process.env.CJ_INTEGRATION_MODE = "LIVE";
    process.env.CJ_API_KEY = "test-key";
    process.env.CJ_API_SECRET = "test-secret";

    const toolResult = (await invokeTool("customer_order.submit_fulfillment", {
      pipelineId: pipeline.pipelineId,
    })) as { blocked: boolean; protectTheEmpire: boolean };

    assert.equal(toolResult.blocked, true);
    assert.equal(toolResult.protectTheEmpire, true);

    await assert.rejects(
      () => submitPipelineFulfillment(pipeline.pipelineId),
      CustomerOrderPipelineBlockedError,
    );

    delete process.env.CJ_INTEGRATION_MODE;
    delete process.env.CJ_API_KEY;
    delete process.env.CJ_API_SECRET;
  });

  it("ingests payment idempotently", async () => {
    const slug = uniqueSlug("idempotent");
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandId: "brand-gk",
      slug,
      productName: "Idempotent Product",
      productDescription: "Idempotent test",
      priceCents: 3500,
      cjSupplierSku: "CJ-SKU-IDEM",
      cjSupplierProductId: "CJ-PID-IDEM",
      unitCostCents: 1000,
    });

    const checkout = await createLiveCheckout({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      productName: deployed.store.productName,
      amountCents: 3500,
    });

    const payment = await completeMockCheckout({
      sessionId: checkout.sessionId,
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      amountCents: 3500,
      storeId: deployed.store.storeId,
    });

    const first = await ingestVerifiedPayment(payment.paymentId);
    const second = await ingestVerifiedPayment(payment.paymentId);

    assert.equal(first.pipelineId, second.pipelineId);
    assert.equal(second.status, "AWAITING_FULFILLMENT_APPROVAL");
  });

  it("lists pipelines via Brain tool", async () => {
    const listed = (await invokeTool("customer_order.list_pipelines", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    })) as { pipelines: Array<{ pipelineId: string }> };

    assert.ok(Array.isArray(listed.pipelines));
  });
});
