import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { initializeExecutiveRegistry } from "../../executive-council/services/executive-registry-service.js";
import { seedRevenuePipeline, resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  buildLiveProductIntelligence,
  liveProductIntelligenceTools,
  LIVE_PRODUCT_INTELLIGENCE_MISSION_ID,
} from "../../runtime/live-product-intelligence/index.js";
import {
  buildExecutiveProductOptimization,
  executiveProductOptimizationTools,
  EXECUTIVE_PRODUCT_OPTIMIZATION_MISSION_ID,
} from "../../runtime/executive-product-optimization/index.js";
import {
  buildSupplierIntelligenceLoop,
  supplierIntelligenceLoopTools,
  SUPPLIER_INTELLIGENCE_LOOP_MISSION_ID,
} from "../../runtime/supplier-intelligence-loop/index.js";
import {
  buildGlobalOpportunityEngine,
  globalOpportunityEngineTools,
  GLOBAL_OPPORTUNITY_ENGINE_MISSION_ID,
} from "../../runtime/global-opportunity-engine/index.js";
import {
  buildRevenueImprovementEngine,
  revenueImprovementEngineTools,
  REVENUE_IMPROVEMENT_ENGINE_MISSION_ID,
} from "../../runtime/revenue-improvement-engine/index.js";
import {
  buildGlobalCommandCenter,
  globalCommandCenterTools,
  GLOBAL_COMMAND_CENTER_MISSION_IDS,
} from "../../runtime/global-command-center/index.js";

const WORKSPACE_ID = "ws-lci-001";
const COMPANY_ID = "co-grand-king";

describe("Live Commerce Intelligence (REAL-013→REAL-018)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    seedRevenuePipeline(WORKSPACE_ID, COMPANY_ID);
  });

  afterEach(() => {
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("REAL-013 — live product intelligence evaluates lifecycle labels", () => {
    const dash = buildLiveProductIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, LIVE_PRODUCT_INTELLIGENCE_MISSION_ID);
    assert.ok(dash.liveProducts.length > 0);
    assert.ok(dash.winners.length + dash.atRisk.length <= dash.liveProducts.length);
    assert.equal(dash.architectureComplete, true);
    for (const p of dash.liveProducts) {
      assert.ok(p.whySucceedingOrFailing.length > 0);
      assert.ok(p.reusedModules.includes("grand-king-revenue-pipeline"));
    }
  });

  it("REAL-014 — executive product optimization blocks auto-execute", () => {
    const opt = buildExecutiveProductOptimization(WORKSPACE_ID, COMPANY_ID);
    assert.equal(opt.missionId, EXECUTIVE_PRODUCT_OPTIMIZATION_MISSION_ID);
    assert.ok(opt.recommendations.length > 0);
    assert.ok(opt.recommendations.every((r) => r.autoExecuteBlocked === true));
    assert.ok(opt.debateTopic.length > 0);
  });

  it("REAL-015 — supplier intelligence loop emits executive-only signals", () => {
    const loop = buildSupplierIntelligenceLoop(WORKSPACE_ID, COMPANY_ID);
    assert.equal(loop.missionId, SUPPLIER_INTELLIGENCE_LOOP_MISSION_ID);
    assert.ok(loop.supplierHealthScore >= 0);
    assert.ok(loop.signals.every((s) => s.executiveOnly === true));
  });

  it("REAL-016 — global opportunity engine queues expansion opportunities", () => {
    const engine = buildGlobalOpportunityEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(engine.missionId, GLOBAL_OPPORTUNITY_ENGINE_MISSION_ID);
    assert.ok(engine.opportunityQueue.length > 0);
    assert.ok(engine.opportunityQueue.every((o) => o.executiveRecommendation.length > 0));
  });

  it("REAL-017 — revenue improvement engine aggregates proposals", () => {
    const engine = buildRevenueImprovementEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(engine.missionId, REVENUE_IMPROVEMENT_ENGINE_MISSION_ID);
    assert.ok(engine.proposals.length > 0);
    assert.ok(engine.proposals.every((p) => p.autoExecuteBlocked === true));
    assert.ok(engine.totalExpectedProfitGainUsd >= 0);
  });

  it("REAL-018 — global command center operational HQ aggregates REAL-013→017", () => {
    const hq = buildGlobalCommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.deepEqual(hq.missionIds, [...GLOBAL_COMMAND_CENTER_MISSION_IDS]);
    assert.equal(hq.architectureComplete, true);
    assert.ok(hq.executiveMorningBrief.length > 0);
    assert.ok(hq.reusedModules.length >= 8);
    assert.ok(hq.soulRecommendation.length > 0);
    assert.ok(hq.countryHeatMap.length > 0);
    assert.ok(hq.marketplaceHeatMap.length > 0);
  });

  it("Brain tools registered for live commerce intelligence modules", () => {
    assert.ok(liveProductIntelligenceTools.some((t) => t.name === "live_product_intelligence.dashboard"));
    assert.ok(executiveProductOptimizationTools.some((t) => t.name === "executive_product_optimization.dashboard"));
    assert.ok(supplierIntelligenceLoopTools.some((t) => t.name === "supplier_intelligence_loop.dashboard"));
    assert.ok(globalOpportunityEngineTools.some((t) => t.name === "global_opportunity_engine.dashboard"));
    assert.ok(revenueImprovementEngineTools.some((t) => t.name === "revenue_improvement_engine.dashboard"));
    assert.ok(globalCommandCenterTools.some((t) => t.name === "global_command_center.dashboard"));
  });
});
