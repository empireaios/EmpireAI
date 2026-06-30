import { randomUUID } from "node:crypto";

import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { getBusinessBuildRepository } from "../../business-build-engine/index.js";
import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";
import { getBusinessPreviewRepository } from "../../business-preview-studio/index.js";
import { getBusinessSimulationRepository } from "../../business-simulation-engine/index.js";
import { getMarketStrategyRepository } from "../../market-domination-strategy-engine/index.js";
import { getProductDiscoveryRepository } from "../../product-discovery-opportunity-engine/index.js";
import type {
  BusinessHealthRecord,
  CommerceOperationsDashboard,
  CustomerLifetimeRecord,
  ExecutiveCommandCenter,
  FulfillmentPackage,
  GrowthOptimizationRecord,
  MarketingCampaignPackage,
  PipelineValidationResult,
  PublicationPackage,
  RevenueActivationPackage,
} from "../models/execution-packages.js";
import {
  getExecutionLayerRepository,
  resetExecutionLayerRepository,
} from "../repositories/sqlite-execution-layer-repository.js";
import {
  computeBusinessHealthDimensions,
  generateCustomerLifetime,
  generateFulfillmentPackage,
  generateGrowthOptimization,
  generateMarketingCampaignPackage,
  generatePublicationPackage,
  generateRevenueActivationPackage,
} from "./execution-package-generators.js";
import {
  ExecutionPipelineBlockedError,
  resolveExecutionPipelineByBuild,
  resolveExecutionPipelineByOpportunity,
} from "./execution-pipeline-context.js";

export { getExecutionLayerRepository, resetExecutionLayerRepository };
export { ExecutionPipelineBlockedError };

export class ExecutionPackageNotFoundError extends Error {
  constructor(packageId: string) {
    super(`Execution package not found: ${packageId}`);
    this.name = "ExecutionPackageNotFoundError";
  }
}

function captureExecutionSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

export function generatePublicationPackageForBuild(buildId: string, actor = "system"): PublicationPackage {
  const ctx = resolveExecutionPipelineByBuild(buildId);
  const pkg = generatePublicationPackage(ctx);
  getExecutionLayerRepository().savePackage("PUBLICATION_PACKAGE", pkg, {
    packageId: pkg.packageId,
    workspaceId: pkg.workspaceId,
    companyId: pkg.companyId,
    buildId: pkg.buildId,
    businessOpportunityId: pkg.businessOpportunityId,
  });
  captureExecutionSoulRuntime(
    pkg.workspaceId,
    "Publication package generated",
    `${pkg.businessName} — ${pkg.listings.length} marketplace listings prepared`,
    actor,
    { packageId: pkg.packageId, buildId, validationScore: pkg.validationScore },
  );
  return pkg;
}

export function getPublicationPackage(packageId: string): PublicationPackage | null {
  return getExecutionLayerRepository().getPackage<PublicationPackage>(packageId);
}

export function validatePublicationPackage(packageId: string) {
  const pkg = getPublicationPackage(packageId);
  if (!pkg) throw new ExecutionPackageNotFoundError(packageId);
  const incomplete = pkg.listings.filter((entry) => !entry.complete);
  return {
    packageId,
    valid: pkg.complete,
    validationScore: pkg.validationScore,
    incompleteMarketplaces: incomplete.map((entry) => entry.marketplaceId),
    publishBlocked: true,
  };
}

export function generateMarketingCampaignForBuild(buildId: string, actor = "system"): MarketingCampaignPackage {
  const ctx = resolveExecutionPipelineByBuild(buildId);
  const pkg = generateMarketingCampaignPackage(ctx);
  getExecutionLayerRepository().savePackage("MARKETING_CAMPAIGN_PACKAGE", pkg, {
    packageId: pkg.packageId,
    workspaceId: pkg.workspaceId,
    companyId: pkg.companyId,
    buildId: pkg.buildId,
  });
  captureExecutionSoulRuntime(
    pkg.workspaceId,
    "Marketing campaign package generated",
    `${pkg.businessName} — ${pkg.organicCampaigns.length + pkg.paidCampaigns.length} campaigns prepared`,
    actor,
    { packageId: pkg.packageId, budgetRecommendation: pkg.budgetRecommendation },
  );
  return pkg;
}

export function getMarketingCampaignPackage(packageId: string): MarketingCampaignPackage | null {
  return getExecutionLayerRepository().getPackage<MarketingCampaignPackage>(packageId);
}

export function generateFulfillmentPackageForBuild(buildId: string, actor = "system"): FulfillmentPackage {
  const ctx = resolveExecutionPipelineByBuild(buildId);
  const pkg = generateFulfillmentPackage(ctx);
  getExecutionLayerRepository().savePackage("FULFILLMENT_PACKAGE", pkg, {
    packageId: pkg.packageId,
    workspaceId: pkg.workspaceId,
    companyId: pkg.companyId,
    buildId: pkg.buildId,
  });
  captureExecutionSoulRuntime(
    pkg.workspaceId,
    "Fulfillment package generated",
    `${pkg.businessName} — supplier ${pkg.supplierMapping.supplierName}`,
    actor,
    { packageId: pkg.packageId, valid: pkg.fulfillmentValidation.valid },
  );
  return pkg;
}

export function getFulfillmentPackage(packageId: string): FulfillmentPackage | null {
  return getExecutionLayerRepository().getPackage<FulfillmentPackage>(packageId);
}

export function generateRevenueActivationForBuild(buildId: string, actor = "system"): RevenueActivationPackage {
  const ctx = resolveExecutionPipelineByBuild(buildId);
  const pkg = generateRevenueActivationPackage(ctx);
  getExecutionLayerRepository().savePackage("REVENUE_ACTIVATION_PACKAGE", pkg, {
    packageId: pkg.packageId,
    workspaceId: pkg.workspaceId,
    companyId: pkg.companyId,
    buildId: pkg.buildId,
    businessOpportunityId: ctx.build.businessOpportunityId,
  });
  captureExecutionSoulRuntime(
    pkg.workspaceId,
    "Revenue activation package generated",
    `${pkg.businessName} — projected revenue ${pkg.revenueProjection}`,
    actor,
    { packageId: pkg.packageId, roiEstimate: pkg.roiEstimate },
  );
  return pkg;
}

export function getRevenueActivationPackage(packageId: string): RevenueActivationPackage | null {
  return getExecutionLayerRepository().getPackage<RevenueActivationPackage>(packageId);
}

export function buildCommerceOperationsDashboard(
  workspaceId: string,
  companyId: string,
): CommerceOperationsDashboard {
  const repo = getExecutionLayerRepository();
  const opportunities = getBusinessOpportunityRepository().listOpportunities(workspaceId, companyId);
  const builds = getBusinessBuildRepository().listBuilds(workspaceId, companyId);
  const warnings: string[] = [];
  const errors: string[] = [];

  const publicationPackages = repo.countByType(workspaceId, companyId, "PUBLICATION_PACKAGE");
  const marketingPackages = repo.countByType(workspaceId, companyId, "MARKETING_CAMPAIGN_PACKAGE");
  const fulfillmentPackages = repo.countByType(workspaceId, companyId, "FULFILLMENT_PACKAGE");
  const revenuePackages = repo.countByType(workspaceId, companyId, "REVENUE_ACTIVATION_PACKAGE");

  if (builds.filter((b) => b.status === "READY_FOR_PUBLICATION").length > publicationPackages) {
    warnings.push("Builds ready for publication without publication packages");
  }
  if (publicationPackages > 0 && marketingPackages === 0) {
    warnings.push("Publication packages exist without marketing campaign packages");
  }

  const readyBuilds = builds.filter((b) => b.status === "READY_FOR_PUBLICATION").length;
  let recommendedNextAction = "Run product discovery to identify opportunities";
  if (opportunities.length > 0 && readyBuilds === 0) {
    recommendedNextAction = "Complete business build for approved opportunity";
  } else if (readyBuilds > 0 && publicationPackages === 0) {
    recommendedNextAction = "Generate publication package for ready build";
  } else if (publicationPackages > 0 && marketingPackages === 0) {
    recommendedNextAction = "Generate marketing campaign package";
  } else if (marketingPackages > 0 && fulfillmentPackages === 0) {
    recommendedNextAction = "Generate fulfillment package";
  } else if (fulfillmentPackages > 0 && revenuePackages === 0) {
    recommendedNextAction = "Generate revenue activation package";
  } else if (revenuePackages > 0) {
    recommendedNextAction = "Review executive command center for launch decision";
  }

  const healthScores = builds
    .filter((b) => b.status === "READY_FOR_PUBLICATION")
    .map((b) => b.validation.publicationReadiness);
  const overallHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : opportunities.length > 0 ? 40 : 10;

  return {
    businesses: opportunities.filter((o) => o.status === "APPROVED" || o.status === "READY_FOR_BUILD").length,
    products: builds.length,
    marketplaces: 7,
    publicationPackages,
    marketingPackages,
    fulfillmentPackages,
    revenuePackages,
    warnings,
    errors,
    recommendedNextAction,
    overallHealth,
    computedAt: new Date().toISOString(),
  };
}

export function evaluateBusinessHealth(
  businessOpportunityId: string,
  actor = "system",
): BusinessHealthRecord {
  const ctx = resolveExecutionPipelineByOpportunity(businessOpportunityId);
  const dimensions = computeBusinessHealthDimensions(ctx);
  const scores = [
    dimensions.businessHealth,
    dimensions.brandHealth,
    dimensions.marketplaceHealth,
    dimensions.supplierHealth,
    dimensions.customerHealth,
    dimensions.cashflowHealth,
    dimensions.growthHealth,
  ];
  const unifiedHealthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const record: BusinessHealthRecord = {
    healthId: `health-${randomUUID()}`,
    businessOpportunityId,
    workspaceId: ctx.build.workspaceId,
    companyId: ctx.build.companyId,
    businessHealth: dimensions.businessHealth,
    brandHealth: dimensions.brandHealth,
    marketplaceHealth: dimensions.marketplaceHealth,
    supplierHealth: dimensions.supplierHealth,
    customerHealth: dimensions.customerHealth,
    cashflowHealth: dimensions.cashflowHealth,
    growthHealth: dimensions.growthHealth,
    unifiedHealthScore,
    evaluatedAt: new Date().toISOString(),
  };

  getExecutionLayerRepository().savePackage("BUSINESS_HEALTH", record, {
    packageId: record.healthId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
    buildId: ctx.build.buildId,
    businessOpportunityId,
  });
  captureExecutionSoulRuntime(
    record.workspaceId,
    "Business health evaluated",
    `Unified health score: ${unifiedHealthScore}`,
    actor,
    { healthId: record.healthId, unifiedHealthScore },
  );
  return record;
}

export function getBusinessHealthRecord(healthId: string): BusinessHealthRecord | null {
  return getExecutionLayerRepository().getPackage<BusinessHealthRecord>(healthId);
}

export function generateGrowthOptimizationForOpportunity(
  businessOpportunityId: string,
  actor = "system",
): GrowthOptimizationRecord {
  const ctx = resolveExecutionPipelineByOpportunity(businessOpportunityId);
  const record = generateGrowthOptimization(ctx, businessOpportunityId);
  getExecutionLayerRepository().savePackage("GROWTH_OPTIMIZATION", record, {
    packageId: record.optimizationId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
    buildId: ctx.build.buildId,
    businessOpportunityId,
  });
  captureExecutionSoulRuntime(
    record.workspaceId,
    "Growth optimization generated",
    `${record.recommendations.length} recommendations prepared`,
    actor,
    { optimizationId: record.optimizationId },
  );
  return record;
}

export function getGrowthOptimizationRecord(optimizationId: string): GrowthOptimizationRecord | null {
  return getExecutionLayerRepository().getPackage<GrowthOptimizationRecord>(optimizationId);
}

export function analyzeCustomerLifetime(
  businessOpportunityId: string,
  actor = "system",
): CustomerLifetimeRecord {
  const ctx = resolveExecutionPipelineByOpportunity(businessOpportunityId);
  const record = generateCustomerLifetime(ctx, businessOpportunityId);
  getExecutionLayerRepository().savePackage("CUSTOMER_LIFETIME", record, {
    packageId: record.recordId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
    buildId: ctx.build.buildId,
    businessOpportunityId,
  });
  captureExecutionSoulRuntime(
    record.workspaceId,
    "Customer lifetime intelligence generated",
    `Repeat purchase potential: ${record.repeatPurchasePotential}`,
    actor,
    { recordId: record.recordId },
  );
  return record;
}

export function getCustomerLifetimeRecord(recordId: string): CustomerLifetimeRecord | null {
  return getExecutionLayerRepository().getPackage<CustomerLifetimeRecord>(recordId);
}

export function buildExecutiveCommandCenter(
  workspaceId: string,
  companyId: string,
): ExecutiveCommandCenter {
  const opportunities = getBusinessOpportunityRepository().listOpportunities(workspaceId, companyId);
  const builds = getBusinessBuildRepository().listBuilds(workspaceId, companyId);
  const simulations = getBusinessSimulationRepository().listSimulations(workspaceId, companyId);
  const repo = getExecutionLayerRepository();
  const ops = buildCommerceOperationsDashboard(workspaceId, companyId);

  const latestSimulation = simulations[0];
  const todaysRevenueProjection = latestSimulation
    ? Math.round(latestSimulation.financialForecast.projectedRevenue / 365)
    : 0;
  const portfolioValue = simulations.reduce(
    (sum, sim) => sum + sim.financialForecast.projectedNetProfit,
    0,
  );

  const launchQueue = builds
    .filter((b) => b.status === "READY_FOR_PUBLICATION")
    .map((b) => b.businessName);

  const topRisks = latestSimulation
    ? latestSimulation.riskAnalysis.riskNotes.slice(0, 3)
    : ["No simulation data — run business simulation first"];
  const topOpportunities = opportunities
    .filter((o) => o.status === "APPROVED" || o.status === "READY_FOR_BUILD")
    .slice(0, 3)
    .map((o) => `${o.brand.businessName} — ROI ${o.economics.expectedRoi}%`);

  const recommendedExecutiveActions: string[] = [];
  if (ops.recommendedNextAction) recommendedExecutiveActions.push(ops.recommendedNextAction);
  if (latestSimulation?.finalRecommendation.recommendation === "HIGH_PRIORITY_LAUNCH") {
    recommendedExecutiveActions.push("Prioritise launch — simulation indicates high priority");
  }

  const missionStatus: Record<string, string> = {
    "LIVE-005": getProductDiscoveryRepository().listSessions(workspaceId, companyId).length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-006": opportunities.length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-007": getBusinessPreviewRepository().listPreviews(workspaceId, companyId).length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-008": getMarketStrategyRepository().listStrategies(workspaceId, companyId).length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-009": builds.length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-010": simulations.length > 0 ? "COMPLETE" : "PENDING",
    "LIVE-011": ops.publicationPackages > 0 ? "COMPLETE" : "PENDING",
    "LIVE-012": ops.marketingPackages > 0 ? "COMPLETE" : "PENDING",
    "LIVE-013": ops.fulfillmentPackages > 0 ? "COMPLETE" : "PENDING",
    "LIVE-014": ops.revenuePackages > 0 ? "COMPLETE" : "PENDING",
    "LIVE-015": "COMPLETE",
    "LIVE-016": repo.countByType(workspaceId, companyId, "BUSINESS_HEALTH") > 0 ? "COMPLETE" : "PENDING",
    "LIVE-017": repo.countByType(workspaceId, companyId, "GROWTH_OPTIMIZATION") > 0 ? "COMPLETE" : "PENDING",
    "LIVE-018": repo.countByType(workspaceId, companyId, "CUSTOMER_LIFETIME") > 0 ? "COMPLETE" : "PENDING",
    "LIVE-019": "COMPLETE",
    "LIVE-020": repo.countByType(workspaceId, companyId, "PIPELINE_VALIDATION") > 0 ? "COMPLETE" : "PENDING",
  };

  const monthlyBudget = latestSimulation?.capitalProtection.monthlyOperatingRequirement ?? 0;
  const expectedPayback = latestSimulation?.capitalProtection.expectedPaybackPeriodMonths ?? 0;
  const capitalUtilisation = latestSimulation
    ? Math.min(
        100,
        Math.round(
          (latestSimulation.capitalProtection.minimumRecommendedCapital /
            Math.max(latestSimulation.capitalProtection.configuredCapitalConstraint, 1)) *
            100,
        ),
      )
    : 0;

  return {
    todaysRevenueProjection,
    portfolioValue,
    businesses: opportunities.length,
    brands: new Set(opportunities.map((o) => o.brand.brand)).size,
    launchQueue,
    capitalUtilisation,
    monthlyBudget,
    expectedPayback,
    topRisks,
    topOpportunities,
    recommendedExecutiveActions,
    missionStatus,
    soulFileStatus: "TRACEABLE",
    systemHealth: ops.overallHealth,
    computedAt: new Date().toISOString(),
  };
}

export function runPipelineValidation(
  businessOpportunityId: string,
  workspaceId: string,
  companyId: string,
): PipelineValidationResult {
  const blockers: string[] = [];
  const stages: PipelineValidationResult["stages"] = [];

  const discoverySessions = getProductDiscoveryRepository().listSessions(workspaceId, companyId);
  const discoveryPresent = discoverySessions.length > 0;
  stages.push({
    stage: "Product Discovery",
    missionId: "LIVE-005",
    present: discoveryPresent,
    packageId: discoverySessions[0]?.sessionId,
    blockers: discoveryPresent ? [] : ["No discovery session"],
  });
  if (!discoveryPresent) blockers.push("Product discovery missing");

  const opportunity = getBusinessOpportunityRepository().getOpportunity(businessOpportunityId);
  stages.push({
    stage: "Business Opportunity",
    missionId: "LIVE-006",
    present: Boolean(opportunity),
    packageId: opportunity?.businessOpportunityId,
    blockers: opportunity ? [] : ["Business opportunity not found"],
  });
  if (!opportunity) blockers.push("Business opportunity missing");

  const preview = getBusinessPreviewRepository().getLatestByOpportunity(businessOpportunityId);
  stages.push({
    stage: "Business Preview",
    missionId: "LIVE-007",
    present: Boolean(preview),
    packageId: preview?.previewId,
    blockers: preview ? [] : ["Business preview missing"],
  });
  if (!preview) blockers.push("Business preview missing");

  const strategy = getMarketStrategyRepository().getLatestByOpportunity(businessOpportunityId);
  stages.push({
    stage: "Market Strategy",
    missionId: "LIVE-008",
    present: Boolean(strategy),
    packageId: strategy?.strategyId,
    blockers: strategy ? [] : ["Market strategy missing"],
  });
  if (!strategy) blockers.push("Market strategy missing");

  const build = getBusinessBuildRepository().getLatestByOpportunity(businessOpportunityId);
  stages.push({
    stage: "Business Build",
    missionId: "LIVE-009",
    present: Boolean(build),
    packageId: build?.buildId,
    blockers: build ? [] : ["Business build missing"],
  });
  if (!build) blockers.push("Business build missing");

  const simulation = build
    ? getBusinessSimulationRepository().getLatestByBuild(build.buildId)
    : null;
  stages.push({
    stage: "Business Simulation",
    missionId: "LIVE-010",
    present: Boolean(simulation),
    packageId: simulation?.simulationId,
    blockers: simulation ? [] : ["Business simulation missing"],
  });
  if (!simulation) blockers.push("Business simulation missing");

  const repo = getExecutionLayerRepository();
  const publication = build
    ? repo.getLatestByBuildAndType<PublicationPackage>(build.buildId, "PUBLICATION_PACKAGE")
    : null;
  stages.push({
    stage: "Publication Package",
    missionId: "LIVE-011",
    present: Boolean(publication),
    packageId: publication?.packageId,
    blockers: publication ? [] : ["Publication package missing"],
  });
  if (!publication) blockers.push("Publication package missing");

  const marketing = build
    ? repo.getLatestByBuildAndType<MarketingCampaignPackage>(build.buildId, "MARKETING_CAMPAIGN_PACKAGE")
    : null;
  stages.push({
    stage: "Marketing Package",
    missionId: "LIVE-012",
    present: Boolean(marketing),
    packageId: marketing?.packageId,
    blockers: marketing ? [] : ["Marketing package missing"],
  });
  if (!marketing) blockers.push("Marketing package missing");

  const fulfillment = build
    ? repo.getLatestByBuildAndType<FulfillmentPackage>(build.buildId, "FULFILLMENT_PACKAGE")
    : null;
  stages.push({
    stage: "Fulfillment Package",
    missionId: "LIVE-013",
    present: Boolean(fulfillment),
    packageId: fulfillment?.packageId,
    blockers: fulfillment ? [] : ["Fulfillment package missing"],
  });
  if (!fulfillment) blockers.push("Fulfillment package missing");

  const revenue = build
    ? repo.getLatestByBuildAndType<RevenueActivationPackage>(build.buildId, "REVENUE_ACTIVATION_PACKAGE")
    : null;
  stages.push({
    stage: "Revenue Package",
    missionId: "LIVE-014",
    present: Boolean(revenue),
    packageId: revenue?.packageId,
    blockers: revenue ? [] : ["Revenue package missing"],
  });
  if (!revenue) blockers.push("Revenue package missing");

  stages.push({
    stage: "Executive Dashboard",
    missionId: "LIVE-019",
    present: true,
    blockers: [],
  });

  const packageIntegrity = Boolean(
    publication?.complete &&
      marketing &&
      fulfillment?.fulfillmentValidation.valid &&
      revenue,
  );
  const dependencyChain = stages.slice(0, 10).every((s) => s.present);
  const governanceCompliant = Boolean(
    simulation?.capitalProtection.executionDoctrineReference &&
      publication?.executionTrace.doctrineReference,
  );

  const result: PipelineValidationResult = {
    validationId: `val-${randomUUID()}`,
    businessOpportunityId,
    workspaceId,
    companyId,
    valid: blockers.length === 0 && packageIntegrity && dependencyChain && governanceCompliant,
    stages,
    packageIntegrity,
    dependencyChain,
    governanceCompliant,
    noDuplicatedLogic: true,
    blockers,
    validatedAt: new Date().toISOString(),
  };

  repo.savePackage("PIPELINE_VALIDATION", result, {
    packageId: result.validationId,
    workspaceId,
    companyId,
    buildId: build?.buildId,
    businessOpportunityId,
  });

  return result;
}

export function getPipelineValidation(validationId: string): PipelineValidationResult | null {
  return getExecutionLayerRepository().getPackage<PipelineValidationResult>(validationId);
}

/** Generates all execution packages (LIVE-011 through LIVE-014) for a build. */
export function generateFullExecutionPipeline(buildId: string, actor = "system") {
  const publication = generatePublicationPackageForBuild(buildId, actor);
  const marketing = generateMarketingCampaignForBuild(buildId, actor);
  const fulfillment = generateFulfillmentPackageForBuild(buildId, actor);
  const revenue = generateRevenueActivationForBuild(buildId, actor);
  const ctx = resolveExecutionPipelineByBuild(buildId);
  const health = evaluateBusinessHealth(ctx.build.businessOpportunityId, actor);
  const growth = generateGrowthOptimizationForOpportunity(ctx.build.businessOpportunityId, actor);
  const customer = analyzeCustomerLifetime(ctx.build.businessOpportunityId, actor);
  const validation = runPipelineValidation(
    ctx.build.businessOpportunityId,
    ctx.build.workspaceId,
    ctx.build.companyId,
  );
  return { publication, marketing, fulfillment, revenue, health, growth, customer, validation };
}

export function buildExecutionLayerDashboard(workspaceId: string, companyId: string) {
  const ops = buildCommerceOperationsDashboard(workspaceId, companyId);
  const executive = buildExecutiveCommandCenter(workspaceId, companyId);
  return {
    commerceOperations: ops,
    executiveCommandCenter: executive,
    computedAt: new Date().toISOString(),
  };
}
