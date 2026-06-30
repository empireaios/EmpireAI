import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  approveBusinessOpportunity,
  listBusinessOpportunities,
  resetBusinessOpportunityRepository,
} from "../../orchestration/business-opportunity-workspace/index.js";
import { resetBusinessPreviewRepository } from "../../orchestration/business-preview-studio/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import {
  compareMarketStrategies,
  generateMarketStrategyForOpportunity,
  getMarketStrategy,
  listMarketStrategies,
  marketDominationStrategyTools,
  resetMarketStrategyRepository,
  buildMarketStrategySummary,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live008";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "market-domination-strategy-engine",
    correlationId: "corr-live008",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = marketDominationStrategyTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedApprovedOpportunity() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Strategy Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  return target.businessOpportunityId;
}

function seedTwoApprovedOpportunities() {
  for (const category of ["kitchen", "beauty"]) {
    const started = startProductDiscoverySession({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: `Strategy ${category}`,
      category,
      targetMarket: "US",
      existingSupplierNetwork: ["cj-dropshipping"],
    });
    runProductDiscovery(started.sessionId);
  }
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  for (const opp of opportunities.slice(0, 2)) {
    approveBusinessOpportunity(opp.businessOpportunityId, "founder@test.com");
  }
  return opportunities.slice(0, 2).map((entry) => entry.businessOpportunityId);
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-008 Market Domination Strategy Engine", () => {
  it("registers five market strategy Brain tools", () => {
    assert.equal(marketDominationStrategyTools.length, 5);
    assert.ok(marketDominationStrategyTools.some((tool) => tool.name === "market_strategy.generate"));
    assert.ok(marketDominationStrategyTools.some((tool) => tool.name === "market_strategy.summary"));
  });

  it("generates complete market domination strategy document", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const strategy = generateMarketStrategyForOpportunity(businessOpportunityId, "founder@test.com");

    assert.ok(strategy.identity.businessMission.length > 0);
    assert.ok(strategy.identity.brandPosition.length > 0);
    assert.ok(strategy.identity.targetCustomer.length > 0);
    assert.ok(strategy.identity.customerPersona.length > 0);
    assert.ok(strategy.identity.coreValueProposition.length > 0);
    assert.ok(strategy.identity.brandPromise.length > 0);

    assert.ok(strategy.battlefield.primaryMarketplace.length > 0);
    assert.ok(strategy.battlefield.competitorWeaknesses.length > 0);
    assert.ok(strategy.battlefield.marketGaps.length > 0);

    assert.ok(strategy.competitiveAdvantages.length >= 8);
    for (const advantage of strategy.competitiveAdvantages) {
      assert.ok(advantage.rationale.length > 0);
      assert.ok(advantage.strength >= 0);
    }

    assert.ok(strategy.customerPsychology.painPoints.length > 0);
    assert.ok(strategy.customerPsychology.objections.length > 0);
    assert.ok(strategy.customerPsychology.recommendedResponses.length > 0);

    assert.ok(strategy.pricingStrategy.launchPrice > 0);
    assert.ok(strategy.pricingStrategy.recommendedMargin >= 0);

    assert.equal(strategy.marketplaceStrategy.length, 7);
    for (const entry of strategy.marketplaceStrategy) {
      assert.ok(entry.reason.length > 0);
      assert.ok(entry.confidence >= 0);
    }

    assert.ok(strategy.brandGrowthRoadmap.phase1InitialNiche.length > 0);
    assert.ok(strategy.riskAssessment.topRisks.length > 0);
    assert.ok(strategy.riskAssessment.killConditions.length > 0);

    assert.ok(
      ["DO_NOT_BUILD", "BUILD_WITH_CAUTION", "BUILD", "HIGH_PRIORITY_BUILD"].includes(
        strategy.grandKingRecommendation.recommendation,
      ),
    );
    assert.ok(strategy.grandKingRecommendation.reasoning.length > 0);
    assert.ok(strategy.overallConfidence >= 0);
    assert.ok(strategy.winningStrategySummary.length > 0);
  });

  it("lists, gets, and compares strategies", () => {
    const ids = seedTwoApprovedOpportunities();
    const strategyA = generateMarketStrategyForOpportunity(ids[0]!);
    const strategyB = generateMarketStrategyForOpportunity(ids[1]!);

    const listed = listMarketStrategies(WORKSPACE_ID, COMPANY_ID);
    assert.ok(listed.length >= 2);

    const fetched = getMarketStrategy(strategyA.strategyId);
    assert.ok(fetched);
    assert.equal(fetched!.strategyId, strategyA.strategyId);

    const comparison = compareMarketStrategies(strategyA.strategyId, strategyB.strategyId);
    assert.ok(comparison.highlights.higherConfidence);
    assert.ok(comparison.highlights.strongerRecommendation);
    assert.ok(comparison.summary.length > 0);
  });

  it("builds workspace strategy summary", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    generateMarketStrategyForOpportunity(businessOpportunityId);

    const summary = buildMarketStrategySummary(WORKSPACE_ID, COMPANY_ID);
    assert.equal(summary.totalStrategies, 1);
    assert.ok(summary.averageConfidence >= 0);
    assert.ok(summary.topStrategy);
  });

  it("exposes market domination strategy on Grand King dashboard", () => {
    const businessOpportunityId = seedApprovedOpportunity();
    generateMarketStrategyForOpportunity(businessOpportunityId);

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.marketDominationStrategy);
    assert.ok(dashboard.marketDominationStrategy!.mission.length > 0);
    assert.ok(dashboard.marketDominationStrategy!.winningStrategy.length > 0);
    assert.ok(Array.isArray(dashboard.marketDominationStrategy!.competitiveAdvantages));
    assert.ok(dashboard.marketDominationStrategy!.primaryBattlefield.length > 0);
    assert.ok(dashboard.marketDominationStrategy!.overallConfidence >= 0);
  });

  it("generates strategy via Brain tools without execution", async () => {
    const businessOpportunityId = seedApprovedOpportunity();
    const strategy = await invokeTool("market_strategy.generate", { businessOpportunityId });
    assert.ok((strategy as { strategyId: string }).strategyId);

    const summary = await invokeTool("market_strategy.summary");
    assert.ok((summary as { totalStrategies: number }).totalStrategies >= 1);
  });
});
