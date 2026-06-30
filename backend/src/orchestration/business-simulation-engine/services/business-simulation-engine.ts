import { randomUUID } from "node:crypto";

import { CANONICAL_DOCTRINE_IDS } from "../../../foundation/doctrine-engine/models/doctrine.js";
import {
  buildExecutionTrace,
  buildExplainableRecommendation,
  EA_EXECUTION_DOCTRINE_ID,
} from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";
import { generateMarketingCampaignIntelligence } from "../../../execution/marketing-campaign-intelligence/scoring/marketing-campaign-intelligence-scoring.js";
import { evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import type { BusinessBuildPackage } from "../../business-build-engine/models/business-build-package.js";
import type { MarketDominationStrategyDocument } from "../../market-domination-strategy-engine/models/market-domination-strategy.js";
import { getCommerceReadinessSummary } from "../../commerce-readiness-engine/index.js";
import type {
  BusinessSimulationRecord,
  CapitalProtection,
  CommercialForecast,
  FinancialForecast,
  ScenarioCase,
  ScenarioHorizon,
  ScenarioProjection,
  SimulationLaunchRecommendation,
  SimulationRiskAnalysis,
} from "../models/business-simulation.js";
import { SCENARIO_CASES, SCENARIO_HORIZONS } from "../models/business-simulation.js";

/** Default Grand King monthly capital constraint for simulation (USD). */
const DEFAULT_MONTHLY_CAPITAL_CONSTRAINT = 8_000;

const RECOMMENDATION_RANK: Record<SimulationLaunchRecommendation, number> = {
  DO_NOT_LAUNCH: 0,
  LAUNCH_WITH_CAUTION: 1,
  READY_FOR_LAUNCH: 2,
  HIGH_PRIORITY_LAUNCH: 3,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function buildMarketingIntel(opportunity: BusinessOpportunityRecord, build: BusinessBuildPackage) {
  return generateMarketingCampaignIntelligence({
    brand: {
      brandId: `brand:${opportunity.brand.brand}`,
      brandName: build.brandAssets.finalBrandName,
      slogan: build.productAssets.productSubtitle,
      niche: opportunity.brand.category,
      targetAudience: build.productAssets.productSubtitle,
      positioning: build.brandAssets.brandVoice,
      confidence: opportunity.brand.brandConfidence,
    },
    offer: {
      offerTitle: build.productAssets.productTitle,
      headline: build.seoAssets.seoTitle,
      valueProposition: build.productAssets.productDescription.slice(0, 160),
      keyBenefits: build.productAssets.productBenefits.slice(0, 4),
      callToAction: "Buy now",
      confidence: opportunity.economics.launchConfidence,
    },
    launchConfidence: opportunity.economics.launchConfidence,
    opportunityType: "DROPSHIPPING",
  });
}

function baseMonthlyOrders(opportunity: BusinessOpportunityRecord, marketingConfidence: number): number {
  const revenueBase = opportunity.economics.expectedMonthlyRevenue / Math.max(buildAvgOrderValue(opportunity), 1);
  const marketingBoost = marketingConfidence / 100;
  return Math.max(5, Math.round(revenueBase * marketingBoost));
}

function buildAvgOrderValue(opportunity: BusinessOpportunityRecord): number {
  return Math.max(25, 30 + opportunity.economics.dominationScore * 0.3);
}

function buildFinancialForecast(
  opportunity: BusinessOpportunityRecord,
  build: BusinessBuildPackage,
  monthlyOrders: number,
): FinancialForecast {
  const price = build.marketplacePackages[0]?.price ?? strategyPrice(build);
  const margin = opportunity.economics.estimatedMargin;
  const monthlyRevenue = price * monthlyOrders;
  const cogsPercent = 100 - margin;
  const grossProfit = monthlyRevenue * (margin / 100);
  const monthlyCosts = monthlyRevenue * 0.25 + 500;
  const netProfit = grossProfit - monthlyCosts;
  const initialInvestment = Math.max(1000, 5000 - opportunity.economics.expectedRoi * 30);
  const breakEvenPointMonths =
    netProfit <= 0 ? 24 : Math.max(1, Math.round(initialInvestment / netProfit));

  const cashflowProjection = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const growth = 1 + index * 0.04;
    const revenue = monthlyRevenue * growth;
    const costs = monthlyCosts * (1 + index * 0.02);
    return {
      month,
      revenue: Math.round(revenue * 100) / 100,
      costs: Math.round(costs * 100) / 100,
      netCashflow: Math.round((revenue * (margin / 100) - costs) * 100) / 100,
    };
  });

  return {
    projectedRevenue: Math.round(monthlyRevenue * 12 * 100) / 100,
    projectedGrossProfit: Math.round(grossProfit * 12 * 100) / 100,
    projectedNetProfit: Math.round(netProfit * 12 * 100) / 100,
    breakEvenPointMonths,
    cashflowProjection,
    marginAnalysis: {
      grossMarginPercent: margin,
      netMarginPercent: monthlyRevenue > 0 ? Math.round((netProfit / monthlyRevenue) * 100) : 0,
      cogsPercent,
    },
  };
}

function strategyPrice(build: BusinessBuildPackage): number {
  return build.marketplacePackages.find((entry) => entry.ready)?.price ?? 29.99;
}

function buildCommercialForecast(
  opportunity: BusinessOpportunityRecord,
  marketingIntel: ReturnType<typeof buildMarketingIntel>,
  monthlyOrders: number,
): CommercialForecast {
  const conversionBase = 2 + opportunity.economics.dominationScore * 0.05;
  const marketingBoost = (marketingIntel.confidence ?? 70) * 0.02;
  return {
    conversionRateEstimate: clamp(conversionBase + marketingBoost, 0, 15),
    clickThroughEstimate: clamp(1.5 + opportunity.economics.launchConfidence * 0.03, 0, 10),
    expectedOrders: monthlyOrders * 12,
    expectedRefundRate: clamp(5 + (100 - opportunity.economics.shippingEstimate) * 0.1, 0, 25),
    expectedReturnRate: clamp(3 + opportunity.economics.competitionEstimate * 0.05, 0, 20),
  };
}

function buildScenarioAnalysis(
  financial: FinancialForecast,
  commercial: CommercialForecast,
): ScenarioProjection[] {
  const projections: ScenarioProjection[] = [];
  const multipliers: Record<ScenarioCase, { revenue: number; orders: number; cost: number }> = {
    BEST_CASE: { revenue: 1.35, orders: 1.4, cost: 0.9 },
    EXPECTED_CASE: { revenue: 1.0, orders: 1.0, cost: 1.0 },
    WORST_CASE: { revenue: 0.65, orders: 0.55, cost: 1.2 },
  };
  const horizonMonths: Record<ScenarioHorizon, number> = {
    "30_DAYS": 1,
    "90_DAYS": 3,
    "12_MONTHS": 12,
  };

  for (const horizon of SCENARIO_HORIZONS) {
    const months = horizonMonths[horizon];
    for (const scenarioCase of SCENARIO_CASES) {
      const mult = multipliers[scenarioCase];
      const monthlyRevenue = (financial.projectedRevenue / 12) * mult.revenue;
      const monthlyGross = (financial.projectedGrossProfit / 12) * mult.revenue;
      const monthlyNet = (financial.projectedNetProfit / 12) * mult.revenue * mult.cost;
      projections.push({
        horizon,
        case: scenarioCase,
        revenue: Math.round(monthlyRevenue * months * 100) / 100,
        grossProfit: Math.round(monthlyGross * months * 100) / 100,
        netProfit: Math.round(monthlyNet * months * 100) / 100,
        orders: Math.round((commercial.expectedOrders / 12) * months * mult.orders),
      });
    }
  }
  return projections;
}

function buildRiskAnalysis(
  opportunity: BusinessOpportunityRecord,
  strategy: MarketDominationStrategyDocument,
  build: BusinessBuildPackage,
  supplierConfidence: number,
): SimulationRiskAnalysis {
  const financialRisk = clamp(100 - opportunity.economics.expectedRoi);
  const operationalRisk = clamp(100 - build.validation.publicationReadiness);
  const supplierRisk = clamp(100 - supplierConfidence);
  const primaryMarketplace = strategy.battlefield.primaryMarketplace;
  const marketplaceEntry = strategy.marketplaceStrategy.find(
    (entry) => entry.marketplaceId === primaryMarketplace,
  );
  const marketplaceRisk = clamp(marketplaceEntry?.expectedDifficulty ?? 50);
  const customerRisk = clamp(
    commercialRiskFromStrategy(strategy) + opportunity.economics.competitionEstimate * 0.3,
  );
  const brandRisk = clamp(100 - opportunity.brand.brandConfidence);
  const overallRisk = clamp(
    financialRisk * 0.2 +
      operationalRisk * 0.15 +
      supplierRisk * 0.2 +
      marketplaceRisk * 0.15 +
      customerRisk * 0.15 +
      brandRisk * 0.15,
  );

  return {
    financialRisk,
    operationalRisk,
    supplierRisk,
    marketplaceRisk,
    customerRisk,
    brandRisk,
    overallRisk,
    riskNotes: strategy.riskAssessment.topRisks.slice(0, 3),
  };
}

function commercialRiskFromStrategy(strategy: MarketDominationStrategyDocument): number {
  return strategy.grandKingRecommendation.recommendation === "DO_NOT_BUILD" ? 80 : 30;
}

function buildCapitalProtection(
  opportunity: BusinessOpportunityRecord,
  financial: FinancialForecast,
  monthlyOperatingRequirement: number,
  configuredConstraint: number = DEFAULT_MONTHLY_CAPITAL_CONSTRAINT,
): CapitalProtection {
  const minimumRecommendedCapital = Math.max(
    1500,
    Math.round(financial.breakEvenPointMonths * monthlyOperatingRequirement * 0.5),
  );
  const capitalBlocked = monthlyOperatingRequirement > configuredConstraint;
  return {
    doctrineReference: CANONICAL_DOCTRINE_IDS.FOUNDER_SOVEREIGNTY,
    executionDoctrineReference: EA_EXECUTION_DOCTRINE_ID,
    minimumRecommendedCapital,
    monthlyOperatingRequirement,
    configuredCapitalConstraint: configuredConstraint,
    expectedPaybackPeriodMonths: financial.breakEvenPointMonths,
    capitalBlocked,
    blockingReason: capitalBlocked
      ? `Monthly operating requirement $${monthlyOperatingRequirement} exceeds Grand King capital constraint $${configuredConstraint}.`
      : undefined,
  };
}

function resolveLaunchRecommendation(
  opportunity: BusinessOpportunityRecord,
  strategy: MarketDominationStrategyDocument,
  risk: SimulationRiskAnalysis,
  capital: CapitalProtection,
  simulationScore: number,
  readinessScore: number,
): { recommendation: SimulationLaunchRecommendation; reasoning: string } {
  if (capital.capitalBlocked || strategy.grandKingRecommendation.recommendation === "DO_NOT_BUILD") {
    return {
      recommendation: "DO_NOT_LAUNCH",
      reasoning: capital.blockingReason ??
        `Strategy blocks launch — ${strategy.grandKingRecommendation.recommendation}. Simulation score ${simulationScore}/100.`,
    };
  }
  if (risk.overallRisk >= 75 || simulationScore < 45 || readinessScore < 50) {
    return {
      recommendation: "DO_NOT_LAUNCH",
      reasoning: `Risk ${risk.overallRisk}/100, simulation score ${simulationScore}/100 — projected outcomes too weak.`,
    };
  }
  if (risk.overallRisk >= 55 || simulationScore < 60) {
    return {
      recommendation: "LAUNCH_WITH_CAUTION",
      reasoning: `Moderate risk ${risk.overallRisk}/100 — launch with tight capital controls and kill conditions.`,
    };
  }
  if (
    simulationScore >= 80 &&
    risk.overallRisk < 40 &&
    strategy.grandKingRecommendation.recommendation === "HIGH_PRIORITY_BUILD"
  ) {
    return {
      recommendation: "HIGH_PRIORITY_LAUNCH",
      reasoning: `Strong simulation ${simulationScore}/100, low risk ${risk.overallRisk}/100, high-priority strategy alignment.`,
    };
  }
  return {
    recommendation: "READY_FOR_LAUNCH",
    reasoning: `Simulation score ${simulationScore}/100 with acceptable risk ${risk.overallRisk}/100 — ready when Grand King approves publication phase.`,
  };
}

function computeSimulationScore(
  opportunity: BusinessOpportunityRecord,
  financial: FinancialForecast,
  risk: SimulationRiskAnalysis,
  readinessScore: number,
): number {
  return clamp(
    opportunity.economics.dominationScore * 0.25 +
      opportunity.economics.expectedRoi * 0.2 +
      (100 - risk.overallRisk) * 0.25 +
      readinessScore * 0.15 +
      (financial.projectedNetProfit > 0 ? 15 : 0),
  );
}

/** Runs business performance simulation — simulation only, no live execution. */
export function runBusinessSimulation(input: {
  build: BusinessBuildPackage;
  opportunity: BusinessOpportunityRecord;
  strategy: MarketDominationStrategyDocument;
  configuredCapitalConstraint?: number;
}): BusinessSimulationRecord {
  const { build, opportunity, strategy } = input;
  const readiness = getCommerceReadinessSummary({
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    accountType: "grand_king",
  });

  let supplierConfidence = build.supplierPackage.supplierMapping.confidence;
  try {
    const evaluation = evaluateSupplier({
      workspaceId: build.workspaceId,
      supplierId: build.supplierPackage.supplierMapping.supplierId,
    });
    supplierConfidence = Math.round(evaluation.reliabilityScore ?? evaluation.trustScore ?? supplierConfidence);
  } catch {
    // use build confidence
  }

  const marketingIntel = buildMarketingIntel(opportunity, build);
  const monthlyOrders = baseMonthlyOrders(opportunity, marketingIntel.confidence ?? 70);
  const financialForecast = buildFinancialForecast(opportunity, build, monthlyOrders);
  const commercialForecast = buildCommercialForecast(opportunity, marketingIntel, monthlyOrders);
  const scenarioAnalysis = buildScenarioAnalysis(financialForecast, commercialForecast);
  const riskAnalysis = buildRiskAnalysis(opportunity, strategy, build, supplierConfidence);

  const monthlyOperatingRequirement = Math.round(
    financialForecast.projectedRevenue / 12 * 0.35 + 800,
  );
  const capitalProtection = buildCapitalProtection(
    opportunity,
    financialForecast,
    monthlyOperatingRequirement,
    input.configuredCapitalConstraint,
  );

  const simulationScore = computeSimulationScore(
    opportunity,
    financialForecast,
    riskAnalysis,
    readiness.overallReadinessScore,
  );
  const simulationConfidence = clamp(
    simulationScore * 0.4 +
      readiness.overallReadinessScore * 0.3 +
      (marketingIntel.confidence ?? 70) * 0.3,
  );

  const finalRecommendation = resolveLaunchRecommendation(
    opportunity,
    strategy,
    riskAnalysis,
    capitalProtection,
    simulationScore,
    readiness.overallReadinessScore,
  );

  const simulationId = `sim:${randomUUID()}`;

  const explainability = buildExplainableRecommendation({
    why: finalRecommendation.reasoning,
    intelligenceSources: [
      "LIVE-009:business-build-package",
      "LIVE-008:market-domination-strategy",
      "LIVE-006:business-opportunity",
      "commerce-readiness-engine",
      "supplier-intelligence-engine",
      "marketing-campaign-intelligence",
    ],
    confidence: simulationConfidence,
    risks: riskAnalysis.riskNotes,
    alternatives: capitalProtection.capitalBlocked
      ? ["Reduce monthly operating spend", "Defer launch until capital increases"]
      : ["Proceed to publication phase when Grand King approves", "Re-run simulation with tighter capital constraint"],
  });

  const executionTrace = buildExecutionTrace({
    inputPackages: [
      { engineId: "business-build-engine", packageId: build.buildId, packageType: "BusinessBuildPackage" },
      { engineId: "market-domination-strategy-engine", packageId: strategy.strategyId, packageType: "MarketDominationStrategyDocument" },
      { engineId: "business-opportunity-workspace", packageId: opportunity.businessOpportunityId, packageType: "BusinessOpportunityRecord" },
    ],
    outputPackage: {
      engineId: "business-simulation-engine",
      packageId: simulationId,
      packageType: "BusinessSimulationRecord",
    },
    decisionSource: finalRecommendation.recommendation,
    responsibleEngine: "business-simulation-engine",
    confidence: simulationConfidence,
    accountType: "grand_king",
  });

  return {
    simulationId,
    buildId: build.buildId,
    businessOpportunityId: build.businessOpportunityId,
    strategyId: strategy.strategyId,
    workspaceId: build.workspaceId,
    companyId: build.companyId,
    businessName: build.businessName,
    financialForecast,
    commercialForecast,
    scenarioAnalysis,
    riskAnalysis,
    capitalProtection,
    finalRecommendation,
    explainability,
    executionTrace,
    simulationScore,
    simulationConfidence,
    simulatedAt: new Date().toISOString(),
  };
}

export { RECOMMENDATION_RANK };
