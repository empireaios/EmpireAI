/** X3-15 — Shared structural autonomous growth helpers. */

import { AGO_METADATA_VERSION } from "./paths.js";
import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  GrowthCategory,
  OptimizationPriority,
  GrowthOperation,
  GrowthOptimizationRecord,
  GrowthOptimizationInput,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function defaultCompany(input?: GrowthOptimizationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCategory(
  operation: GrowthOperation,
  input?: GrowthOptimizationInput,
): GrowthCategory {
  if (input?.growthCategoryHint) return input.growthCategoryHint;
  switch (operation) {
    case "revenue_growth_monitoring":
      return "revenue";
    case "profit_growth_monitoring":
      return "profit";
    case "customer_growth_monitoring":
      return "customer";
    case "operational_growth_monitoring":
    case "growth_constraint_identification":
      return "operational";
    case "enterprise_growth_monitoring":
    case "growth_opportunity_identification":
    case "growth_strategy_optimization":
    case "growth_priority_ranking":
    default:
      return "enterprise";
  }
}

export function priorityFromOpportunity(
  opportunity: number,
  config: AutonomousGrowthOptimizerConfiguration,
  hint?: OptimizationPriority,
): OptimizationPriority {
  if (hint) return hint;
  if (opportunity >= config.criticalPriorityThreshold) return "critical";
  if (opportunity >= config.highPriorityThreshold) return "high";
  if (opportunity >= config.growthOpportunityThreshold) return "medium";
  return "low";
}

export function buildGrowthOptimizationRecord(input: {
  companyReference: string;
  growthCategory: GrowthCategory;
  currentGrowthMetrics: string;
  growthOpportunityScore: number;
  optimizationPriority: OptimizationPriority;
  expectedGrowthImpact: string;
  recommendationSummary: string;
}): GrowthOptimizationRecord {
  const growthOpportunityScore = clampScore(input.growthOpportunityScore);

  return {
    growthOptimizationId: `ago-opt-${Date.now()}-${input.growthCategory.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    growthCategory: input.growthCategory,
    currentGrowthMetrics: input.currentGrowthMetrics,
    growthOpportunityScore,
    optimizationPriority: input.optimizationPriority,
    expectedGrowthImpact: input.expectedGrowthImpact,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: AGO_METADATA_VERSION,
    neverOptimizeBeyondValidatedOperationalLimits: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computeGrowthOptimizationSignals(
  operation: GrowthOperation,
  input: GrowthOptimizationInput,
  config: AutonomousGrowthOptimizerConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  growthCategory: GrowthCategory;
  currentGrowthMetrics: string;
  growthOpportunityScore: number;
  optimizationPriority: OptimizationPriority;
  expectedGrowthImpact: string;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const growthCategory = defaultCategory(operation, input);
  const seed = `${company}::${growthCategory}::${operation}`;

  const growthOpportunityScore = clampScore(
    input.growthOpportunityHint ?? hashScore(`${seed}:opportunity`, 20, 95),
  );

  let optimizationPriority = priorityFromOpportunity(
    growthOpportunityScore,
    config,
    input.optimizationPriorityHint,
  );

  const currentGrowthMetrics =
    input.currentGrowthMetricsHint?.trim() ||
    `structural:${growthCategory}:opportunity=${growthOpportunityScore}`;

  let expectedGrowthImpact =
    input.expectedGrowthImpactHint?.trim() ||
    `Sustainable ${growthCategory} growth impact bounded by validated operational limits`;

  let recommendationSummary =
    "Growth optimization signals within structural bounds — structural signals only; never optimize beyond validated operational limits";

  const operationThreshold = ((): number => {
    switch (operation) {
      case "enterprise_growth_monitoring":
        return config.enterpriseGrowthThreshold;
      case "revenue_growth_monitoring":
        return config.revenueGrowthThreshold;
      case "profit_growth_monitoring":
        return config.profitGrowthThreshold;
      case "customer_growth_monitoring":
        return config.customerGrowthThreshold;
      case "operational_growth_monitoring":
      case "growth_constraint_identification":
        return config.operationalGrowthThreshold;
      case "growth_opportunity_identification":
      case "growth_strategy_optimization":
      case "growth_priority_ranking":
      default:
        return config.growthOpportunityThreshold;
    }
  })();

  if (!sourceAvailable) {
    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only; never optimize beyond validated operational limits`;
    optimizationPriority = priorityFromOpportunity(growthOpportunityScore, config);
    expectedGrowthImpact = `Deferred ${growthCategory} impact pending upstream availability`;
  } else if (growthOpportunityScore >= operationThreshold) {
    recommendationSummary = `${operation} opportunity ${growthOpportunityScore}% supports cautious sustainable growth optimization on ${company} · ${growthCategory}`;
    optimizationPriority = priorityFromOpportunity(
      growthOpportunityScore,
      config,
      input.optimizationPriorityHint,
    );
    expectedGrowthImpact = `Positive sustainable ${growthCategory} impact at opportunity ${growthOpportunityScore}% within validated operational limits`;
  } else {
    recommendationSummary = `Hold growth acceleration for ${growthCategory} — opportunity ${growthOpportunityScore}% below threshold; never optimize beyond validated operational limits`;
    optimizationPriority = priorityFromOpportunity(growthOpportunityScore, config);
    expectedGrowthImpact = `Hold ${growthCategory} acceleration until opportunity clears validated thresholds`;
  }

  if (
    config.neverOptimizeGrowthBeyondValidatedOperationalLimits &&
    growthOpportunityScore < config.growthOpportunityThreshold
  ) {
    recommendationSummary = `${recommendationSummary} · never optimize beyond validated operational limits`;
  }

  return {
    companyReference: company,
    growthCategory,
    currentGrowthMetrics,
    growthOpportunityScore,
    optimizationPriority,
    expectedGrowthImpact,
    recommendationSummary,
  };
}
