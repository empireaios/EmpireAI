import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { revenueLoopTools } from "../../revenue/minimum-live-revenue-loop/tools/revenue-loop-tools.js";
import {
  buildMockCheckoutCompletedEvent,
  buildStorefrontHtml,
  deployLiveStore,
  getRevenueLoopRepository,
  ingestCheckoutCompleted,
  applyFulfillmentApproval,
  submitLiveFulfillment,
  LiveFulfillmentBlockedError,
  readDeployedStorefront,
} from "../../revenue/minimum-live-revenue-loop/index.js";
import type { ToolContext } from "../../brain/types.js";
import { getDatabase } from "../../brain/database.js";

const WORKSPACE_ID = "ws-m101";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "revenue-loop",
    correlationId: "corr-m101",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = revenueLoopTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m101-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.REVENUE_LOOP_STORE_BASE_URL = "http://localhost:4000";
  process.env.REVENUE_LOOP_MOCK_PAYMENTS = "true";
  process.env.REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED = "false";
  delete process.env.STRIPE_SECRET_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 101 Minimum Live Revenue Loop", () => {
  it("registers five revenue loop Brain tools", () => {
    const names = revenueLoopTools.map((tool) => tool.name);
    assert.deepEqual(names, [
      "revenue_loop.deploy_store",
      "revenue_loop.create_checkout",
      "revenue_loop.list_orders",
      "revenue_loop.apply_fulfillment_approval",
      "revenue_loop.submit_live_fulfillment",
    ]);
  });

  it("deploys storefront to disk with analytics and checkout CTA", () => {
    const result = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "grand-king-store",
      productName: "Premium Kitchen Blender",
      productDescription: "Ship-ready bestseller for US customers.",
      priceCents: 4999,
      cjSupplierSku: "CJ-SKU-001",
      cjSupplierProductId: "CJ-PID-001",
      unitCostCents: 1800,
    });

    assert.equal(result.store.status, "CHECKOUT_ENABLED");
    assert.ok(fs.existsSync(path.join(result.deployPath, "index.html")));

    const html = readDeployedStorefront("grand-king-store");
    assert.ok(html);
    assert.match(html!, /Premium Kitchen Blender/);
    assert.match(html!, /gtag/);
    assert.match(html!, /fbq/);
    assert.match(html!, /\/store\/grand-king-store\/checkout/);
  });

  it("creates mock checkout session when Stripe is not configured", async () => {
    deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "checkout-test",
      productName: "Test Product",
      productDescription: "Test",
      priceCents: 2999,
      cjSupplierSku: "SKU-1",
      cjSupplierProductId: "PID-1",
      unitCostCents: 900,
    });

    const session = (await invokeTool("revenue_loop.create_checkout", {
      storeSlug: "checkout-test",
    })) as { mock: boolean; url: string };

    assert.equal(session.mock, true);
    assert.match(session.url, /checkout\/mock/);
  });

  it("ingests mock payment into revenue order with ledger and profit estimate", async () => {
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "payment-test",
      productName: "Profit Product",
      productDescription: "High margin test",
      priceCents: 6000,
      cjSupplierSku: "SKU-PROFIT",
      cjSupplierProductId: "PID-PROFIT",
      unitCostCents: 1500,
    });

    const event = buildMockCheckoutCompletedEvent("cs_mock_payment_test", {
      storeId: deployed.store.storeId,
      storeSlug: deployed.store.slug,
      workspaceId: WORKSPACE_ID,
      companyId: deployed.store.companyId,
      amountTotal: "6000",
      currency: "usd",
    });

    const record = await ingestCheckoutCompleted({ event });

    assert.equal(record.status, "AWAITING_FULFILLMENT_APPROVAL");
    assert.equal(record.revenueCents, 6000);
    assert.ok(record.fulfillmentOrder);
    assert.equal(record.fulfillmentOrder?.shippingAddress.countryCode, "US");
    assert.ok(record.profitCents > 0);
    assert.equal(record.profitable, true);

    const db = getDatabase();
    const ledgerRows = db
      .prepare(
        `SELECT event_type FROM financial_ledger_events WHERE correlation_id = @cid`,
      )
      .all({ cid: "cs_mock_payment_test" }) as Array<{ event_type: string }>;
    assert.ok(ledgerRows.some((row) => row.event_type === "sale"));
  });

  it("requires founder approval before live fulfillment", async () => {
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "approval-test",
      productName: "Gate Product",
      productDescription: "Approval gate test",
      priceCents: 4500,
      cjSupplierSku: "SKU-GATE",
      cjSupplierProductId: "PID-GATE",
      unitCostCents: 1200,
    });

    const event = buildMockCheckoutCompletedEvent("cs_mock_approval_test", {
      storeId: deployed.store.storeId,
      storeSlug: deployed.store.slug,
      workspaceId: WORKSPACE_ID,
      companyId: deployed.store.companyId,
      amountTotal: "4500",
      currency: "usd",
    });

    const ingested = await ingestCheckoutCompleted({ event });
    const approved = applyFulfillmentApproval({
      recordId: ingested.recordId,
      approvalToken: "founder-approve-m101",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    assert.equal(approved.status, "APPROVED");
    assert.equal(approved.fulfillmentOrder?.status, "APPROVED");
  });

  it("blocks live CJ fulfillment when Protect The Empire gate is disabled", async () => {
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "live-block-test",
      productName: "Live Block Product",
      productDescription: "Live gate test",
      priceCents: 5500,
      cjSupplierSku: "SKU-LIVE",
      cjSupplierProductId: "PID-LIVE",
      unitCostCents: 1400,
    });

    const ingested = await ingestCheckoutCompleted({
      event: buildMockCheckoutCompletedEvent("cs_mock_live_block", {
        storeId: deployed.store.storeId,
        storeSlug: deployed.store.slug,
        workspaceId: WORKSPACE_ID,
        companyId: deployed.store.companyId,
        amountTotal: "5500",
        currency: "usd",
      }),
    });

    const approved = applyFulfillmentApproval({
      recordId: ingested.recordId,
      approvalToken: "token-live-block",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const toolResult = (await invokeTool("revenue_loop.submit_live_fulfillment", {
      recordId: approved.recordId,
    })) as { blocked: boolean; protectTheEmpire: boolean };

    assert.equal(toolResult.blocked, true);
    assert.equal(toolResult.protectTheEmpire, true);

    await assert.rejects(
      () => submitLiveFulfillment(approved.recordId),
      LiveFulfillmentBlockedError,
    );
  });

  it("lists orders via repository after payment ingestion", async () => {
    const deployed = deployLiveStore({
      workspaceId: WORKSPACE_ID,
      companyId: "co-grand-king",
      brandId: "brand-gk",
      slug: "list-orders-test",
      productName: "List Product",
      productDescription: "List test",
      priceCents: 3500,
      cjSupplierSku: "SKU-LIST",
      cjSupplierProductId: "PID-LIST",
      unitCostCents: 1000,
    });

    await ingestCheckoutCompleted({
      event: buildMockCheckoutCompletedEvent("cs_mock_list", {
        storeId: deployed.store.storeId,
        storeSlug: deployed.store.slug,
        workspaceId: WORKSPACE_ID,
        companyId: deployed.store.companyId,
        amountTotal: "3500",
        currency: "usd",
      }),
    });

    const listed = (await invokeTool("revenue_loop.list_orders")) as {
      orders: Array<{ recordId: string }>;
    };

    assert.ok(listed.orders.length >= 1);
    assert.ok(getRevenueLoopRepository().listStores(WORKSPACE_ID).length >= 1);
  });

  it("builds analytics scripts with purchase tracking hooks", () => {
    const html = buildStorefrontHtml({
      storeSlug: "analytics-test",
      productName: "Analytics Product",
      productDescription: "Track me",
      priceCents: 1999,
      currency: "USD",
      checkoutUrl: "/store/analytics-test/checkout",
      storeBaseUrl: "http://localhost:4000",
      analytics: {
        ga4MeasurementId: "G-TEST123",
        metaPixelId: "1234567890",
      },
    });

    assert.match(html, /G-TEST123/);
    assert.match(html, /1234567890/);
    assert.match(html, /begin_checkout/);
    assert.match(html, /InitiateCheckout/);
  });
});
