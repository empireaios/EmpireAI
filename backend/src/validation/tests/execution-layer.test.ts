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
  resetBusinessSimulationRepository,
  runBusinessSimulationForBuild,
} from "../../orchestration/business-simulation-engine/index.js";
import {
  generateMarketStrategyForOpportunity,
  resetMarketStrategyRepository,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import {
  PUBLICATION_MARKETPLACES,
  ORGANIC_CHANNELS,
  PAID_CHANNELS,
  createExecutionLayerModuleContract,
  executionLayerTools,
  generateFullExecutionPipeline,
  generatePublicationPackageForBuild,
  buildCommerceOperationsDashboard,
  buildExecutiveCommandCenter,
  runPipelineValidation,
  resetExecutionLayerRepository,
} from "../../orchestration/execution-layer/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live011";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "execution-layer",
    correlationId: "corr-live011",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = executionLayerTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedPipelineThroughSimulation() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "Execution Brand",
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
  runBusinessSimulationForBuild(build.buildId);
  return {
    buildId: build.buildId,
    businessOpportunityId: target.businessOpportunityId,
  };
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetExecutionLayerRepository();
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
  resetExecutionLayerRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-011 → LIVE-020 Execution Layer", () => {
  it("registers twenty execution layer Brain tools", () => {
    assert.equal(executionLayerTools.length, 20);
    assert.ok(executionLayerTools.some((tool) => tool.name === "publication_package.generate"));
    assert.ok(executionLayerTools.some((tool) => tool.name === "pipeline_validation.run"));
    assert.ok(executionLayerTools.some((tool) => tool.name === "executive_command.dashboard"));
  });

  it("declares unified execution layer module contract for LIVE-011 through LIVE-020", () => {
    const contract = createExecutionLayerModuleContract();
    assert.equal(contract.moduleId, "execution-layer");
    assert.equal(contract.missionIds.length, 10);
    assert.equal(contract.protection.noPublishing, true);
    assert.equal(contract.protection.noAds, true);
    assert.equal(contract.protection.noFinancialTransactions, true);
    assert.equal(contract.executionDoctrine.appliesFromMission, "LIVE-011");
  });

  it("LIVE-011 generates publication package for seven marketplaces without live publication", () => {
    const { buildId } = seedPipelineThroughSimulation();
    const pkg = generatePublicationPackageForBuild(buildId);

    assert.equal(pkg.listings.length, 7);
    assert.deepEqual(
      pkg.listings.map((entry) => entry.marketplaceId),
      [...PUBLICATION_MARKETPLACES],
    );
    assert.equal(pkg.complete, true);
    assert.equal(pkg.validationScore, 100);
    assert.ok(pkg.listings.every((entry) => entry.publishBlocked === true));
    assert.ok(pkg.executionTrace.inputPackages.length >= 3);
    assert.equal(pkg.executionTrace.responsibleEngine, "execution-layer-publication");
  });

  it("LIVE-012 through LIVE-014 generate marketing, fulfillment, and revenue packages", () => {
    const { buildId } = seedPipelineThroughSimulation();
    const result = generateFullExecutionPipeline(buildId);

    assert.equal(result.publication.listings.length, 7);
    assert.equal(result.marketing.organicCampaigns.length, ORGANIC_CHANNELS.length);
    assert.equal(result.marketing.paidCampaigns.length, PAID_CHANNELS.length);
    assert.ok(result.marketing.budgetRecommendation >= 500);
    assert.equal(result.marketing.executionBlocked, true);
    assert.ok(result.fulfillment.supplierMapping.supplierId.length > 0);
    assert.equal(result.fulfillment.executionBlocked, true);
    assert.ok(result.revenue.revenueProjection >= 0);
    assert.equal(result.revenue.transactionBlocked, true);
    assert.ok(result.revenue.cashflowForecast.length > 0);
  });

  it("LIVE-015 commerce operations dashboard aggregates execution packages", () => {
    const { buildId } = seedPipelineThroughSimulation();
    generateFullExecutionPipeline(buildId);

    const ops = buildCommerceOperationsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(ops.businesses >= 0);
    assert.equal(ops.marketplaces, 7);
    assert.equal(ops.publicationPackages, 1);
    assert.equal(ops.marketingPackages, 1);
    assert.equal(ops.fulfillmentPackages, 1);
    assert.equal(ops.revenuePackages, 1);
    assert.ok(ops.recommendedNextAction.length > 0);
    assert.ok(ops.overallHealth >= 0);
  });

  it("LIVE-016 through LIVE-018 evaluate health, growth, and customer lifetime intelligence", () => {
    const { buildId } = seedPipelineThroughSimulation();
    const result = generateFullExecutionPipeline(buildId);

    assert.ok(result.health.unifiedHealthScore >= 0 && result.health.unifiedHealthScore <= 100);
    assert.ok(result.health.businessHealth >= 0);
    assert.ok(result.health.cashflowHealth >= 0);
    assert.ok(result.growth.recommendations.length >= 8);
    assert.equal(result.growth.recommendationOnly, true);
    assert.ok(result.customer.repeatPurchasePotential >= 0);
    assert.equal(result.customer.recommendationOnly, true);
    assert.ok(result.customer.loyaltyOpportunities.length > 0);
  });

  it("LIVE-019 executive command center displays portfolio and mission status", () => {
    const { buildId } = seedPipelineThroughSimulation();
    generateFullExecutionPipeline(buildId);

    const executive = buildExecutiveCommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.ok(executive.todaysRevenueProjection >= 0);
    assert.ok(executive.businesses >= 1);
    assert.ok(executive.launchQueue.length >= 1);
    assert.ok(executive.recommendedExecutiveActions.length > 0);
    assert.equal(executive.soulFileStatus, "TRACEABLE");
    assert.ok(executive.missionStatus["LIVE-011"] === "COMPLETE");
    assert.ok(executive.missionStatus["LIVE-019"] === "COMPLETE");
  });

  it("LIVE-020 validates end-to-end pipeline integrity and dependency chain", () => {
    const { buildId, businessOpportunityId } = seedPipelineThroughSimulation();
    generateFullExecutionPipeline(buildId);

    const validation = runPipelineValidation(businessOpportunityId, WORKSPACE_ID, COMPANY_ID);
    assert.equal(validation.valid, true);
    assert.equal(validation.packageIntegrity, true);
    assert.equal(validation.dependencyChain, true);
    assert.equal(validation.governanceCompliant, true);
    assert.equal(validation.noDuplicatedLogic, true);
    assert.equal(validation.blockers.length, 0);
    assert.equal(validation.stages.length, 11);
    assert.ok(validation.stages.every((stage) => stage.present));
  });

  it("integrates execution layer into Grand King dashboard", () => {
    const { buildId } = seedPipelineThroughSimulation();
    generateFullExecutionPipeline(buildId);

    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.commerceOperations);
    assert.equal(dashboard.commerceOperations!.publicationPackages, 1);
    assert.ok(dashboard.executiveCommandCenter);
    assert.ok(dashboard.executiveCommandCenter!.systemHealth >= 0);
  });

  it("runs full execution pipeline via Brain tools without live execution", async () => {
    const { buildId } = seedPipelineThroughSimulation();

    const publication = await invokeTool("publication_package.generate", { buildId });
    assert.ok((publication as { packageId: string }).packageId);

    const validation = await invokeTool("execution_layer.full_pipeline", { buildId });
    assert.ok((validation as { revenue: { transactionBlocked: boolean } }).revenue.transactionBlocked);

    const executive = await invokeTool("executive_command.dashboard", { companyId: COMPANY_ID });
    assert.ok((executive as { missionStatus: Record<string, string> }).missionStatus["LIVE-014"] === "COMPLETE");
  });
});
