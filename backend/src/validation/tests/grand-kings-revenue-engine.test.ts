import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { prepareMetaCampaign } from "../../execution/meta-ads-connector/index.js";
import { grandKingsRevenueTools } from "../../revenue/grand-kings-revenue-engine/tools/grand-kings-revenue-tools.js";
import {
  getAdvertisingLifecycleSnapshot,
  getCapitalLifecycleSnapshot,
  getKpiLifecycleSnapshot,
  getOrderLifecycleSnapshot,
  getRevenueLifecycleSnapshot,
  listGrandKingsRevenueCycles,
  runGrandKingsRevenueCycle,
} from "../../revenue/grand-kings-revenue-engine/index.js";
import {
  applyPipelineApproval,
  ingestVerifiedPayment,
} from "../../revenue/customer-order-pipeline/index.js";
import {
  completeMockCheckout,
  createLiveCheckout,
} from "../../revenue/live-payment-engine/index.js";
import { deployLiveStore } from "../../revenue/minimum-live-revenue-loop/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m109";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "grand-kings-revenue-engine",
    correlationId: "corr-m109",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = grandKingsRevenueTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

async function seedOperationalStack() {
  const slug = uniqueSlug("gk-revenue");
  const deployed = deployLiveStore({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brandId: "brand-gk",
    slug,
    productName: "Grand King Revenue Product",
    productDescription: "Mission 109 orchestrator seed",
    priceCents: 6800,
    cjSupplierSku: "CJ-BLENDER-001-BLK",
    cjSupplierProductId: "cj-sandbox-blender-001",
    unitCostCents: 2499,
  });

  const checkout = await createLiveCheckout({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    storeId: deployed.store.storeId,
    productName: deployed.store.productName,
    amountCents: 6800,
  });

  const payment = await completeMockCheckout({
    sessionId: checkout.sessionId,
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    amountCents: 6800,
    storeId: deployed.store.storeId,
  });

  await ingestVerifiedPayment(payment.paymentId);

  prepareMetaCampaign({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    name: "Grand King Prospecting",
    budgetCents: 5000,
    audience: {
      countries: ["US"],
      ageMin: 25,
      ageMax: 54,
      interests: ["Ecommerce"],
    },
    creative: {
      headline: "Shop Grand King",
      primaryText: "Launch offer live now.",
      imageUrl: "https://cdn.example.com/ad.jpg",
      callToAction: "SHOP_NOW",
      linkUrl: "https://store.example.com",
    },
  });

  return deployed;
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m109-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.LIVE_PAYMENT_MOCK = "true";
  process.env.META_ADS_MOCK = "true";
  process.env.GRAND_KINGS_REVENUE_ENGINE_ENABLED = "true";
  delete process.env.STRIPE_SECRET_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 109 Grand King's Revenue Engine", () => {
  it("registers eight Grand King's revenue Brain tools", () => {
    assert.equal(grandKingsRevenueTools.length, 8);
    assert.ok(
      grandKingsRevenueTools.some((tool) => tool.name === "grand_kings_revenue.run_cycle"),
    );
  });

  it("collects revenue lifecycle from deployed store and payments", async () => {
    await seedOperationalStack();

    const revenue = getRevenueLifecycleSnapshot(WORKSPACE_ID, COMPANY_ID);

    assert.ok(revenue.storeCount >= 1);
    assert.ok(revenue.deployedStoreCount >= 1);
    assert.ok(revenue.succeededPaymentCount >= 1);
    assert.ok(revenue.totalRevenueCents >= 6800);
    assert.ok(revenue.healthScore > 0);
  });

  it("collects advertising lifecycle from Meta Ads module", async () => {
    await seedOperationalStack();

    const advertising = getAdvertisingLifecycleSnapshot(WORKSPACE_ID, COMPANY_ID);

    assert.ok(advertising.campaignCount >= 1);
    assert.ok(advertising.pendingApprovalCount >= 1);
    assert.ok(advertising.blockers.some((blocker) => blocker.includes("founder approval")));
  });

  it("collects order lifecycle from customer order pipeline", async () => {
    await seedOperationalStack();

    const order = getOrderLifecycleSnapshot(WORKSPACE_ID, COMPANY_ID);

    assert.ok(order.pipelineCount >= 1);
    assert.ok(["IN_PROGRESS", "ACTIVE", "BLOCKED"].includes(order.phase));
  });

  it("collects capital lifecycle from treasury and advertising wallet", () => {
    const capital = getCapitalLifecycleSnapshot(WORKSPACE_ID, COMPANY_ID);

    assert.equal(capital.currency, "USD");
    assert.ok(typeof capital.availableCashCents === "number");
    assert.ok(typeof capital.advertisingWalletCents === "number");
    assert.ok(capital.healthScore >= 0);
  });

  it("computes KPI snapshot with weighted health score", async () => {
    await seedOperationalStack();

    const kpi = getKpiLifecycleSnapshot(WORKSPACE_ID, COMPANY_ID);

    assert.ok(kpi.totalRevenueCents >= 6800);
    assert.ok(kpi.averageOrderValueCents >= 6800);
    assert.ok(kpi.overallHealthScore >= 0);
    assert.ok(kpi.computedAt);
  });

  it("runs full operational cycle and persists snapshot", async () => {
    await seedOperationalStack();

    const cycle = runGrandKingsRevenueCycle({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId: "m109-full-cycle",
    });

    assert.ok(cycle.cycleId);
    assert.equal(cycle.correlationId, "m109-full-cycle");
    assert.ok(cycle.revenue.succeededPaymentCount >= 1);
    assert.ok(cycle.advertising.campaignCount >= 1);
    assert.ok(cycle.order.pipelineCount >= 1);
    assert.ok(cycle.kpi.overallHealthScore >= 0);
    assert.equal(cycle.overallHealthScore, cycle.kpi.overallHealthScore);

    const cycles = listGrandKingsRevenueCycles(WORKSPACE_ID, COMPANY_ID);
    assert.ok(cycles.some((entry) => entry.cycleId === cycle.cycleId));
  });

  it("runs cycle via Brain tool", async () => {
    await seedOperationalStack();

    const cycle = (await invokeTool("grand_kings_revenue.run_cycle", {
      companyId: COMPANY_ID,
    })) as { cycleId: string; revenue: { storeCount: number } };

    assert.ok(cycle.cycleId);
    assert.ok(cycle.revenue.storeCount >= 1);
  });
});
