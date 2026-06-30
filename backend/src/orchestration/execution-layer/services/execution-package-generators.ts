import { randomUUID } from "node:crypto";

import { buildExecutionTrace, buildExplainableRecommendation } from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";
import type { BusinessBuildPackage } from "../../business-build-engine/models/business-build-package.js";
import type { BusinessSimulationRecord } from "../../business-simulation-engine/models/business-simulation.js";
import type { MarketDominationStrategyDocument } from "../../market-domination-strategy-engine/models/market-domination-strategy.js";
import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import {
  ORGANIC_CHANNELS,
  PAID_CHANNELS,
  PUBLICATION_MARKETPLACES,
  type CustomerLifetimeRecord,
  type FulfillmentPackage,
  type GrowthOptimizationRecord,
  type MarketingCampaignPackage,
  type PublicationPackage,
  type RevenueActivationPackage,
} from "../models/execution-packages.js";
import type { ExecutionPipelineContext } from "./execution-pipeline-context.js";

function buildInputPackages(ctx: ExecutionPipelineContext) {
  return [
    { engineId: "business-build-engine", packageId: ctx.build.buildId, packageType: "BusinessBuildPackage" },
    { engineId: "business-simulation-engine", packageId: ctx.simulation.simulationId, packageType: "BusinessSimulationRecord" },
    { engineId: "market-domination-strategy-engine", packageId: ctx.strategy.strategyId, packageType: "MarketDominationStrategyDocument" },
    { engineId: "business-opportunity-workspace", packageId: ctx.opportunity.businessOpportunityId, packageType: "BusinessOpportunityRecord" },
  ];
}

function findBuildListing(build: BusinessBuildPackage, marketplaceId: string) {
  return build.marketplacePackages.find((entry) => entry.marketplaceId === marketplaceId);
}

export function generatePublicationPackage(ctx: ExecutionPipelineContext): PublicationPackage {
  const { build } = ctx;
  const packageId = `pub-${randomUUID()}`;

  const listings = PUBLICATION_MARKETPLACES.map((marketplaceId) => {
    const existing = findBuildListing(build, marketplaceId);
    const baseTitle = existing?.title ?? build.productAssets.productTitle;
    const baseDescription = existing?.description ?? build.productAssets.productDescription;
    const basePrice = existing?.price ?? build.marketplacePackages[0]?.price ?? 29.99;

    return {
      marketplaceId,
      title: baseTitle,
      subtitle: build.productAssets.productSubtitle,
      description: baseDescription,
      bulletPoints: existing?.bulletPoints ?? build.productAssets.productFeatures.slice(0, 5),
      searchTerms: existing?.searchTerms ?? build.seoAssets.marketplaceSearchTerms,
      categoryPath: existing?.categoryPath ?? "Home & Kitchen > Kitchen & Dining",
      brand: build.brandAssets.finalBrandName,
      price: basePrice,
      compareAtPrice: Math.round(basePrice * 1.25 * 100) / 100,
      sku: build.supplierPackage.skuMapping.internalSku,
      images: existing?.images ?? build.visualAssets.productGallery,
      videoUrl: build.videoAssets.shortFormVideo,
      fulfillmentType: "dropship",
      complete: Boolean(baseTitle && baseDescription && basePrice > 0),
      publishBlocked: true as const,
    };
  });

  const completeCount = listings.filter((entry) => entry.complete).length;
  const validationScore = Math.round((completeCount / listings.length) * 100);

  return {
    packageId,
    buildId: build.buildId,
    businessOpportunityId: build.businessOpportunityId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    businessName: build.businessName,
    listings,
    validationScore,
    complete: completeCount === listings.length,
    executionTrace: buildExecutionTrace({
      inputPackages: buildInputPackages(ctx),
      outputPackage: { engineId: "execution-layer", packageId, packageType: "PublicationPackage" },
      decisionSource: "business-build-engine.marketplacePackages",
      responsibleEngine: "execution-layer-publication",
      confidence: validationScore,
    }),
    createdAt: new Date().toISOString(),
  };
}

function buildCampaignCreative(
  channel: string,
  build: BusinessBuildPackage,
  strategy: MarketDominationStrategyDocument,
) {
  const hook = strategy.identity.coreValueProposition.slice(0, 80);
  return {
    channel,
    headline: build.seoAssets.seoTitle,
    hook,
    copy: build.productAssets.productDescription.slice(0, 280),
    cta: "Shop Now — Limited Launch Offer",
    creativePlaceholder: build.visualAssets.heroImage,
  };
}

export function generateMarketingCampaignPackage(ctx: ExecutionPipelineContext): MarketingCampaignPackage {
  const { build, simulation, strategy } = ctx;
  const packageId = `mkt-${randomUUID()}`;

  const organicCampaigns = ORGANIC_CHANNELS.map((channel) =>
    buildCampaignCreative(channel, build, strategy),
  );
  const paidCampaigns = PAID_CHANNELS.map((channel) =>
    buildCampaignCreative(channel, build, strategy),
  );

  const budgetRecommendation = Math.max(
    500,
    Math.round(simulation.financialForecast.projectedRevenue * 0.08),
  );
  const roiProjection = simulation.simulationScore;

  return {
    packageId,
    buildId: build.buildId,
    simulationId: simulation.simulationId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    businessName: build.businessName,
    organicCampaigns,
    paidCampaigns,
    audiences: [
      strategy.identity.targetCustomer,
      ...strategy.battlefield.underservedSegments.slice(0, 2),
    ],
    budgetRecommendation,
    roiProjection,
    executionBlocked: true,
    executionTrace: buildExecutionTrace({
      inputPackages: buildInputPackages(ctx),
      outputPackage: { engineId: "execution-layer", packageId, packageType: "MarketingCampaignPackage" },
      decisionSource: "business-simulation-engine.commercialForecast",
      responsibleEngine: "execution-layer-marketing",
      confidence: simulation.simulationConfidence,
    }),
    createdAt: new Date().toISOString(),
  };
}

export function generateFulfillmentPackage(ctx: ExecutionPipelineContext): FulfillmentPackage {
  const { build, simulation } = ctx;
  const packageId = `ful-${randomUUID()}`;
  const supplier = build.supplierPackage;

  const blockers: string[] = [];
  if (!supplier.ready) blockers.push("Supplier package not ready");
  if (simulation.riskAnalysis.supplierRisk > 70) blockers.push("High supplier risk in simulation");

  return {
    packageId,
    buildId: build.buildId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    businessName: build.businessName,
    supplierMapping: supplier.supplierMapping,
    backupSupplier: {
      supplierId: "backup-cj-dropshipping",
      supplierName: "CJ Dropshipping (Backup)",
      confidence: Math.max(40, supplier.supplierMapping.confidence - 15),
    },
    skuMapping: supplier.skuMapping,
    shippingRules: supplier.shippingRules,
    packagingRequirements: [
      ...supplier.fulfillmentNotes,
      "Include branded insert card",
      "Quality seal on outer packaging",
    ],
    qualityChecklist: [
      ...supplier.qualityRequirements,
      "Verify SKU matches supplier mapping",
      "Inspect for damage before dispatch",
    ],
    returnHandling: [
      "Accept returns within 30 days",
      "Route defective items to supplier RMA",
      "Issue store credit for repeat customers",
    ],
    fulfillmentValidation: {
      valid: blockers.length === 0 && supplier.ready,
      blockers,
    },
    executionBlocked: true,
    executionTrace: buildExecutionTrace({
      inputPackages: buildInputPackages(ctx),
      outputPackage: { engineId: "execution-layer", packageId, packageType: "FulfillmentPackage" },
      decisionSource: "business-build-engine.supplierPackage",
      responsibleEngine: "execution-layer-fulfillment",
      confidence: supplier.supplierMapping.confidence,
    }),
    createdAt: new Date().toISOString(),
  };
}

export function generateRevenueActivationPackage(ctx: ExecutionPipelineContext): RevenueActivationPackage {
  const { build, simulation } = ctx;
  const packageId = `rev-${randomUUID()}`;
  const forecast = simulation.financialForecast;

  const cacEstimate = Math.max(
    12,
    Math.round(forecast.projectedRevenue / Math.max(simulation.commercialForecast.expectedOrders, 1) * 0.35),
  );
  const ltvEstimate = Math.round(cacEstimate * 2.8);

  return {
    packageId,
    buildId: build.buildId,
    simulationId: simulation.simulationId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    businessName: build.businessName,
    revenueProjection: forecast.projectedRevenue,
    grossProfit: forecast.projectedGrossProfit,
    netProfit: forecast.projectedNetProfit,
    breakEvenMonths: forecast.breakEvenPointMonths,
    cacEstimate,
    ltvEstimate,
    roiEstimate: simulation.simulationScore,
    cashflowForecast: forecast.cashflowProjection.map((entry) => ({
      month: entry.month,
      netCashflow: entry.netCashflow,
    })),
    transactionBlocked: true,
    executionTrace: buildExecutionTrace({
      inputPackages: buildInputPackages(ctx),
      outputPackage: { engineId: "execution-layer", packageId, packageType: "RevenueActivationPackage" },
      decisionSource: "business-simulation-engine.financialForecast",
      responsibleEngine: "execution-layer-revenue",
      confidence: simulation.simulationConfidence,
    }),
    createdAt: new Date().toISOString(),
  };
}

export function generateGrowthOptimization(
  ctx: ExecutionPipelineContext,
  businessOpportunityId: string,
): GrowthOptimizationRecord {
  const { build, simulation, strategy, opportunity } = ctx;
  const optimizationId = `gro-${randomUUID()}`;

  const recommendations = [
    { category: "pricing", recommendation: `Test price at ${build.marketplacePackages[0]?.price ?? 29.99} with 10% launch discount`, priority: "HIGH" as const },
    { category: "SEO", recommendation: `Optimise for: ${build.seoAssets.seoKeywords.slice(0, 3).join(", ")}`, priority: "HIGH" as const },
    { category: "keywords", recommendation: `Expand marketplace search terms: ${build.seoAssets.marketplaceSearchTerms.slice(0, 2).join(", ")}`, priority: "MEDIUM" as const },
    { category: "marketplace priority", recommendation: `Lead with ${strategy.battlefield.primaryMarketplace} then ${strategy.battlefield.secondaryMarketplace}`, priority: "HIGH" as const },
    { category: "supplier improvement", recommendation: simulation.riskAnalysis.supplierRisk > 50 ? "Qualify backup supplier before scale" : "Maintain current supplier SLA", priority: simulation.riskAnalysis.supplierRisk > 50 ? "HIGH" as const : "LOW" as const },
    { category: "brand expansion", recommendation: `Extend ${build.brandAssets.finalBrandName} into adjacent ${opportunity.brand.category} sub-niches`, priority: "MEDIUM" as const },
    { category: "product expansion", recommendation: "Add complementary SKU bundle after 90-day baseline", priority: "MEDIUM" as const },
    { category: "cross-selling", recommendation: "Bundle hero product with accessory SKU at checkout", priority: "LOW" as const },
    { category: "up-selling", recommendation: "Offer premium variant at 25% margin uplift", priority: "LOW" as const },
    { category: "repeat purchase", recommendation: "Launch replenishment reminder at day 45 post-purchase", priority: "MEDIUM" as const },
  ];

  return {
    optimizationId,
    businessOpportunityId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    recommendations,
    explainability: buildExplainableRecommendation({
      why: "Growth optimisations derived from build assets, market strategy, and simulation risk profile",
      intelligenceSources: [
        "business-build-engine",
        "market-domination-strategy-engine",
        "business-simulation-engine",
      ],
      confidence: simulation.simulationConfidence,
      risks: simulation.riskAnalysis.riskNotes.slice(0, 3),
      alternatives: ["Delay expansion until break-even achieved", "Focus single marketplace first"],
    }),
    recommendationOnly: true,
    createdAt: new Date().toISOString(),
  };
}

export function generateCustomerLifetime(
  ctx: ExecutionPipelineContext,
  businessOpportunityId: string,
): CustomerLifetimeRecord {
  const { build, simulation, strategy } = ctx;
  const recordId = `clv-${randomUUID()}`;

  return {
    recordId,
    businessOpportunityId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    repeatPurchasePotential: Math.min(95, 100 - simulation.commercialForecast.expectedReturnRate),
    customerSegments: [
      strategy.identity.targetCustomer,
      ...strategy.battlefield.underservedSegments.slice(0, 2),
    ],
    purchaseFrequency: simulation.commercialForecast.expectedOrders > 100 ? "Monthly repeat likely" : "Quarterly repeat likely",
    brandAffinity: Math.max(40, 100 - simulation.riskAnalysis.brandRisk),
    loyaltyOpportunities: ["Points on second purchase", "VIP early access to new SKUs"],
    emailOpportunities: ["Welcome series", "Post-purchase review request", "Replenishment reminder"],
    vipOpportunities: ["Top 10% spenders get free shipping", "Exclusive launch previews"],
    subscriptionOpportunities: ["Subscribe & save 10% on consumables"],
    recommendationOnly: true,
    createdAt: new Date().toISOString(),
  };
}

export function computeBusinessHealthDimensions(ctx: ExecutionPipelineContext) {
  const { build, simulation, strategy, opportunity } = ctx;

  return {
    businessHealth: Math.round((build.buildProgress + simulation.simulationScore) / 2),
    brandHealth: Math.max(0, 100 - simulation.riskAnalysis.brandRisk),
    marketplaceHealth: Math.round(build.validation.publicationReadiness),
    supplierHealth: Math.max(0, 100 - simulation.riskAnalysis.supplierRisk),
    customerHealth: Math.max(0, 100 - simulation.riskAnalysis.customerRisk),
    cashflowHealth: simulation.financialForecast.projectedNetProfit >= 0
      ? Math.min(100, 60 + simulation.simulationScore * 0.4)
      : Math.max(10, 50 - simulation.riskAnalysis.financialRisk * 0.5),
    growthHealth: strategy.overallConfidence,
    opportunityScore: opportunity.economics.dominationScore,
  };
}
