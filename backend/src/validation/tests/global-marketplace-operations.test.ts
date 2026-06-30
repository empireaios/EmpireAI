import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { initializeExecutiveRegistry } from "../../executive-council/services/executive-registry-service.js";
import { seedRevenuePipeline, resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  buildGlobalMarketplaceOperations,
  getCountryOperationsView,
  buildGlobalMarketplaceDistributionDashboard,
  buildGlobalDistributionPlan,
  buildGlobalDistributionExecutiveDebate,
  resetGlobalDistributionPlans,
  globalMarketplaceOperationsTools,
  GLOBAL_MARKETPLACE_OPERATIONS_MISSION_IDS,
} from "../../runtime/global-marketplace-operations/index.js";
import type { SupplierProductInput } from "../../runtime/commerce-intelligence-studio/models/commercial-review.js";

const WORKSPACE_ID = "ws-gmo-001";
const COMPANY_ID = "co-grand-king";

function sampleProduct(): SupplierProductInput {
  return {
    supplierProductId: "sup:gmo:001",
    supplierName: "CJdropshipping",
    title: "Portable Blender Pro",
    category: "kitchen",
    costPrice: 15,
    suggestedRetailPrice: 39.99,
    shippingDays: 10,
    imageUrls: ["https://example.com/blender.jpg"],
    attributes: { color: "Black" },
    tags: ["kitchen"],
  };
}

describe("Global Marketplace Operations (REAL-008–REAL-012)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalDistributionPlans();
    resetGkrRepository();
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    seedRevenuePipeline(WORKSPACE_ID, COMPANY_ID);
  });

  afterEach(() => {
    resetGlobalDistributionPlans();
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("REAL-008 — country × marketplace operations model supports unlimited countries", () => {
    const ops = buildGlobalMarketplaceOperations(WORKSPACE_ID, COMPANY_ID);
    assert.ok(ops.countries.length >= 18);
    assert.ok(ops.slots.length >= 50);
    assert.ok(ops.slots.every((s) => s.countryCode && s.marketplaceName));
    const sg = ops.countries.find((c) => c.countryCode === "SG");
    assert.ok(sg);
    assert.ok(sg!.marketplaceTabs.some((t) => t.marketplaceName.includes("Shopee")));
  });

  it("REAL-009 — global marketplace distribution dashboard for Executive HQ", () => {
    const dashboard = buildGlobalMarketplaceDistributionDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.missionIds[0], "REAL-008");
    assert.ok(dashboard.worldOverview.totalCountries >= 18);
    assert.ok(dashboard.revenueByCountry.length > 0);
    assert.ok(dashboard.operatingModel.grandKingView);
    assert.equal(dashboard.architectureComplete, true);
  });

  it("REAL-010 — country marketplace performance tabs", () => {
    const jp = getCountryOperationsView(WORKSPACE_ID, COMPANY_ID, "JP");
    assert.ok(jp);
    assert.ok(jp!.marketplaceTabs.some((t) => t.marketplaceName.includes("Rakuten") || t.marketplaceName.includes("Amazon")));
    assert.ok(jp!.marketplaceTabs.every((t) => typeof t.productsLive === "number"));
  });

  it("REAL-011 — global product distribution plan without live publish", () => {
    const plan = buildGlobalDistributionPlan(WORKSPACE_ID, COMPANY_ID, sampleProduct(), "prod-gmo-001");
    assert.ok(plan.entries.length > 0);
    assert.equal(plan.livePublishAllowed, false);
    assert.ok(plan.blockers.some((b) => b.includes("governance") || b.includes("Grand King")));
    assert.ok(["HIGH_CONFIDENCE", "EXPERIMENT", "WATCHLIST", "REJECT"].includes(plan.classification));
    assert.ok(plan.countriesFirst.length > 0);
  });

  it("REAL-012 — executive distribution debate with Soul + classification", () => {
    const plan = buildGlobalDistributionPlan(WORKSPACE_ID, COMPANY_ID, sampleProduct(), "prod-gmo-002");
    const debate = buildGlobalDistributionExecutiveDebate(WORKSPACE_ID, COMPANY_ID, plan);
    assert.equal(debate.missionId, "REAL-012");
    assert.equal(debate.chiefCards.length, 12);
    assert.ok(debate.soulRecommendation.launchClassification);
    assert.equal(debate.grandKingDecision.decision, "PENDING");
  });

  it("Brain tools registered for REAL-008→REAL-012", () => {
    assert.equal(GLOBAL_MARKETPLACE_OPERATIONS_MISSION_IDS.length, 5);
    assert.ok(globalMarketplaceOperationsTools.some((t) => t.name === "global_marketplace_operations.dashboard"));
    assert.ok(globalMarketplaceOperationsTools.some((t) => t.name === "global_marketplace_operations.distribution_debate"));
  });
});
