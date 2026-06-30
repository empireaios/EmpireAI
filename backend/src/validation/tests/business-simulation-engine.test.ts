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
import {
  approveBusinessPreviewForBuild,
  generateBusinessPreviewForOpportunity,
  resetBusinessPreviewRepository,
} from "../../orchestration/business-preview-studio/index.js";
import {
  resetBusinessBuildRepository,
  startBusinessBuild,
} from "../../orchestration/business-build-engine/index.js";
import {
  businessSimulationEngineTools,
  getBusinessSimulationForecast,
  getBusinessSimulationRecommendation,
  resetBusinessSimulationRepository,
  runBusinessSimulationForBuild,
  buildBusinessSimulationSummary,
} from "../../orchestration/business-simulation-engine/index.js";
import {
  generateMarketStrategyForOpportunity,
  resetMarketStrategyRepository,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live010";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "business-simulation-engine",
    correlationId: "corr-live010",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = businessSimulationEngineTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedBuildPackage() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Simulation Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  const preview = generateBusinessPreviewForOpportunity(target.businessOpportunityId);
  approveBusinessPreviewForBuild(preview.previewId, "founder@test.com");
  generateMarketStrategyForOpportunity(target.businessOpportunityId);
  const build = startBusinessBuild(target.businessOpportunityId, "founder@test.com");
  return build.buildId;
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-010 Business Simulation Engine", () => {
  it("registers five business simulation Brain tools", () => {
    assert.equal(businessSimulationEngineTools.length, 5);
    assert.ok(businessSimulationEngineTools.some((tool) => tool.name === "business_simulation.run"));
    assert.ok(businessSimulationEngineTools.some((tool) => tool.name === "business_simulation.recommendation"));
  });

  it("runs complete business simulation from build package", () => {
    const buildId = seedBuildPackage();
    const simulation = runBusinessSimulationForBuild(buildId, "founder@test.com");

    assert.ok(simulation.financialForecast.projectedRevenue >= 0);
    assert.ok(simulation.financialForecast.cashflowProjection.length === 12);
    assert.ok(simulation.financialForecast.marginAnalysis.grossMarginPercent >= 0);
    assert.ok(simulation.commercialForecast.conversionRateEstimate >= 0);
    assert.ok(simulation.commercialForecast.expectedOrders >= 0);
    assert.equal(simulation.scenarioAnalysis.length, 9);
    assert.ok(simulation.riskAnalysis.overallRisk >= 0);
    assert.ok(simulation.capitalProtection.doctrineReference.length > 0);
    assert.ok(simulation.capitalProtection.minimumRecommendedCapital >= 0);
    assert.ok(
      ["DO_NOT_LAUNCH", "LAUNCH_WITH_CAUTION", "READY_FOR_LAUNCH", "HIGH_PRIORITY_LAUNCH"].includes(
        simulation.finalRecommendation.recommendation,
      ),
    );
    assert.ok(simulation.finalRecommendation.reasoning.length > 0);
    assert.ok(simulation.explainability.intelligenceSources.length > 0);
    assert.ok(simulation.executionTrace.inputPackages.length >= 3);
    assert.equal(simulation.executionTrace.responsibleEngine, "business-simulation-engine");
    assert.ok(simulation.simulationScore >= 0);
    assert.ok(simulation.simulationConfidence >= 0);
  });

  it("returns forecast and recommendation for a simulation", () => {
    const buildId = seedBuildPackage();
    const simulation = runBusinessSimulationForBuild(buildId);

    const forecast = getBusinessSimulationForecast(simulation.simulationId);
    assert.ok(forecast);
    assert.ok(forecast!.projectedNetProfit !== undefined);

    const recommendation = getBusinessSimulationRecommendation(simulation.simulationId);
    assert.ok(recommendation);
    assert.ok(recommendation!.reasoning.length > 0);
  });

  it("builds workspace simulation summary", () => {
    const buildId = seedBuildPackage();
    runBusinessSimulationForBuild(buildId);

    const summary = buildBusinessSimulationSummary(WORKSPACE_ID, COMPANY_ID);
    assert.equal(summary.totalSimulations, 1);
    assert.ok(summary.topSimulation);
  });

  it("exposes business simulation on Grand King dashboard", () => {
    const buildId = seedBuildPackage();
    runBusinessSimulationForBuild(buildId);

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.businessSimulationEngine);
    assert.ok(dashboard.businessSimulationEngine!.businessSimulationScore >= 0);
    assert.ok(dashboard.businessSimulationEngine!.simulationConfidence >= 0);
  });

  it("runs simulation via Brain tools without publication or fulfillment", async () => {
    const buildId = seedBuildPackage();
    const simulation = await invokeTool("business_simulation.run", { buildId });
    assert.ok((simulation as { simulationId: string }).simulationId);

    const recommendation = await invokeTool("business_simulation.recommendation", {
      simulationId: (simulation as { simulationId: string }).simulationId,
    });
    assert.ok((recommendation as { recommendation: string }).recommendation);
  });
});
