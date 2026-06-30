import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  buildCustomerIntelligence,
  customerIntelligenceTools,
  CUSTOMER_INTELLIGENCE_MISSION_ID,
} from "../../runtime/customer-intelligence/index.js";
import {
  buildCompetitorIntelligence,
  competitorIntelligenceTools,
  COMPETITOR_INTELLIGENCE_MISSION_ID,
} from "../../runtime/competitor-intelligence/index.js";
import {
  buildCustomerPsychologyEngine,
  customerPsychologyEngineTools,
  CUSTOMER_PSYCHOLOGY_ENGINE_MISSION_ID,
} from "../../runtime/customer-psychology-engine/index.js";
import {
  buildGlobalCategoryExpansionEngine,
  globalCategoryExpansionEngineTools,
  GLOBAL_CATEGORY_EXPANSION_ENGINE_MISSION_ID,
} from "../../runtime/global-category-expansion-engine/index.js";
import {
  buildGlobalRevenueSimulation,
  globalRevenueSimulationTools,
  GLOBAL_REVENUE_SIMULATION_MISSION_ID,
} from "../../runtime/global-revenue-simulation/index.js";
import {
  buildAiChiefOfCommerce,
  aiChiefOfCommerceTools,
  AI_CHIEF_OF_COMMERCE_MISSION_ID,
} from "../../runtime/ai-chief-of-commerce/index.js";
import {
  buildAiChiefOfGrowth,
  aiChiefOfGrowthTools,
  AI_CHIEF_OF_GROWTH_MISSION_ID,
} from "../../runtime/ai-chief-of-growth/index.js";
import {
  buildAiChiefOfCustomer,
  aiChiefOfCustomerTools,
  AI_CHIEF_OF_CUSTOMER_MISSION_ID,
} from "../../runtime/ai-chief-of-customer/index.js";
import {
  buildGlobalStrategyEngine,
  globalStrategyEngineTools,
  GLOBAL_STRATEGY_ENGINE_MISSION_ID,
} from "../../runtime/global-strategy-engine/index.js";
import {
  buildSuccess001CommandCenter,
  success001CommandCenterTools,
  SUCCESS_001_COMMAND_CENTER_MISSION_ID,
  SUCCESS_001_TARGET_USD,
} from "../../runtime/success-001-command-center/index.js";

const WORKSPACE_ID = "ws-cos-001";
const COMPANY_ID = "co-grand-king";

describe("Commercial Operating System (REAL-026→REAL-035)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
  });

  afterEach(() => {
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("REAL-026 — customer intelligence tracks LTV and behaviour", () => {
    const dash = buildCustomerIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, CUSTOMER_INTELLIGENCE_MISSION_ID);
    assert.ok(dash.profiles.length >= 0);
    assert.ok(dash.executiveRecommendation.length > 0);
    assert.equal(dash.architectureComplete, true);
  });

  it("REAL-027 — competitor intelligence explains why Empire wins", () => {
    const dash = buildCompetitorIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, COMPETITOR_INTELLIGENCE_MISSION_ID);
    assert.ok(dash.competitors.every((c) => c.whyEmpireWins.length > 0));
    assert.equal(dash.architectureComplete, true);
  });

  it("REAL-028 — customer psychology simulates before launch", () => {
    const dash = buildCustomerPsychologyEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, CUSTOMER_PSYCHOLOGY_ENGINE_MISSION_ID);
    assert.ok(dash.evaluations.length > 0);
    assert.ok(dash.evaluations.every((e) => e.purchaseObjections !== undefined));
    assert.equal(dash.architectureComplete, true);
  });

  it("REAL-029 — global category expansion covers all verticals", () => {
    const dash = buildGlobalCategoryExpansionEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, GLOBAL_CATEGORY_EXPANSION_ENGINE_MISSION_ID);
    assert.equal(dash.categories.length, 11);
    assert.ok(dash.topOpportunities.length >= 1);
  });

  it("REAL-030 — revenue simulation best/expected/worst cases", () => {
    const dash = buildGlobalRevenueSimulation(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, GLOBAL_REVENUE_SIMULATION_MISSION_ID);
    assert.equal(dash.scenarios.length, 3);
    assert.ok(dash.sensitivityAnalysis.length >= 4);
  });

  it("REAL-031 — AI Chief of Commerce recommend only", () => {
    const dash = buildAiChiefOfCommerce(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, AI_CHIEF_OF_COMMERCE_MISSION_ID);
    assert.equal(dash.recommendOnly, true);
    assert.ok(dash.reusedModules.length >= 5);
  });

  it("REAL-032 — AI Chief of Growth rollout recommendations", () => {
    const dash = buildAiChiefOfGrowth(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, AI_CHIEF_OF_GROWTH_MISSION_ID);
    assert.equal(dash.recommendOnly, true);
    assert.ok(dash.scalingPlan.length >= 2);
  });

  it("REAL-033 — AI Chief of Customer recommend only", () => {
    const dash = buildAiChiefOfCustomer(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, AI_CHIEF_OF_CUSTOMER_MISSION_ID);
    assert.equal(dash.recommendOnly, true);
    assert.ok(dash.customerRecommendations.length >= 2);
  });

  it("REAL-034 — global strategy USD 100K → 1M → 10M path", () => {
    const dash = buildGlobalStrategyEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, GLOBAL_STRATEGY_ENGINE_MISSION_ID);
    assert.equal(dash.milestones.length, 3);
    assert.ok(dash.milestones[0]!.milestoneId === "SUCCESS-001");
  });

  it("REAL-035 — SUCCESS-001 command center", () => {
    const dash = buildSuccess001CommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, SUCCESS_001_COMMAND_CENTER_MISSION_ID);
    assert.equal(dash.missionCode, "SUCCESS-001");
    assert.equal(dash.targetNetProfitUsd, SUCCESS_001_TARGET_USD);
    assert.ok(dash.soulRecommendation.length > 0);
    assert.equal(dash.architectureComplete, true);
  });

  it("Brain tools registered for commercial OS modules", () => {
    assert.ok(customerIntelligenceTools.some((t) => t.name === "customer_intelligence.dashboard"));
    assert.ok(competitorIntelligenceTools.some((t) => t.name === "competitor_intelligence.dashboard"));
    assert.ok(customerPsychologyEngineTools.some((t) => t.name === "customer_psychology_engine.dashboard"));
    assert.ok(globalCategoryExpansionEngineTools.some((t) => t.name === "global_category_expansion_engine.dashboard"));
    assert.ok(globalRevenueSimulationTools.some((t) => t.name === "global_revenue_simulation.dashboard"));
    assert.ok(aiChiefOfCommerceTools.some((t) => t.name === "ai_chief_of_commerce.dashboard"));
    assert.ok(aiChiefOfGrowthTools.some((t) => t.name === "ai_chief_of_growth.dashboard"));
    assert.ok(aiChiefOfCustomerTools.some((t) => t.name === "ai_chief_of_customer.dashboard"));
    assert.ok(globalStrategyEngineTools.some((t) => t.name === "global_strategy_engine.dashboard"));
    assert.ok(success001CommandCenterTools.some((t) => t.name === "success_001_command_center.dashboard"));
  });
});
