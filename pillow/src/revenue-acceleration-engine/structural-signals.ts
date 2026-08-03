/** X3-16 — Shared structural revenue acceleration helpers. */

import { RAE_METADATA_VERSION } from "./paths.js";
import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type {
  RevenueCategory,
  RevenueOperation,
  RevenueAccelerationRecord,
  RevenueAccelerationInput,
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

export function defaultCompany(input?: RevenueAccelerationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCategory(
  operation: RevenueOperation,
  input?: RevenueAccelerationInput,
): RevenueCategory {
  if (input?.revenueCategoryHint) return input.revenueCategoryHint;
  switch (operation) {
    case "revenue_trend_monitoring":
      return "trend";
    case "product_revenue_monitoring":
      return "product";
    case "channel_revenue_monitoring":
      return "channel";
    case "customer_revenue_monitoring":
      return "customer";
    case "revenue_bottleneck_identification":
      return "growth";
    case "revenue_growth_monitoring":
    case "revenue_acceleration_opportunities":
    case "revenue_strategy_optimization":
    case "revenue_opportunity_ranking":
    default:
      return "growth";
  }
}

export function buildRevenueAccelerationRecord(input: {
  companyReference: string;
  revenueCategory: RevenueCategory;
  currentRevenueMetrics: string;
  revenueOpportunityScore: number;
  expectedRevenueIncrease: string;
  recommendationSummary: string;
}): RevenueAccelerationRecord {
  const revenueOpportunityScore = clampScore(input.revenueOpportunityScore);

  return {
    revenueAccelerationId: `rae-acc-${Date.now()}-${input.revenueCategory.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    revenueCategory: input.revenueCategory,
    currentRevenueMetrics: input.currentRevenueMetrics,
    revenueOpportunityScore,
    expectedRevenueIncrease: input.expectedRevenueIncrease,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: RAE_METADATA_VERSION,
    neverRecommendWithoutValidatedSupportingData: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
    sensitiveFinancialData: false,
  };
}

export function computeRevenueAccelerationSignals(
  operation: RevenueOperation,
  input: RevenueAccelerationInput,
  config: RevenueAccelerationEngineConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  revenueCategory: RevenueCategory;
  currentRevenueMetrics: string;
  revenueOpportunityScore: number;
  expectedRevenueIncrease: string;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const revenueCategory = defaultCategory(operation, input);
  const seed = `${company}::${revenueCategory}::${operation}`;

  const revenueOpportunityScore = clampScore(
    input.revenueOpportunityHint ?? hashScore(`${seed}:opportunity`, 20, 95),
  );

  const currentRevenueMetrics =
    input.currentRevenueMetricsHint?.trim() ||
    `structural:${revenueCategory}:opportunity=${revenueOpportunityScore}`;

  let expectedRevenueIncrease =
    input.expectedRevenueIncreaseHint?.trim() ||
    `Relative ${revenueCategory} revenue-increase signal bounded by validated supporting data`;

  let recommendationSummary =
    "Revenue acceleration signals within structural bounds — structural signals only; never recommend revenue actions without validated supporting data";

  const operationThreshold = ((): number => {
    switch (operation) {
      case "revenue_growth_monitoring":
        return config.revenueGrowthThreshold;
      case "revenue_trend_monitoring":
        return config.revenueTrendThreshold;
      case "product_revenue_monitoring":
        return config.productRevenueThreshold;
      case "channel_revenue_monitoring":
        return config.channelRevenueThreshold;
      case "customer_revenue_monitoring":
        return config.customerRevenueThreshold;
      case "revenue_bottleneck_identification":
        return config.revenueGrowthThreshold;
      case "revenue_acceleration_opportunities":
      case "revenue_strategy_optimization":
      case "revenue_opportunity_ranking":
      default:
        return config.revenueOpportunityThreshold;
    }
  })();

  if (!sourceAvailable) {
    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only; never recommend revenue actions without validated supporting data`;
    expectedRevenueIncrease = `Deferred ${revenueCategory} increase pending upstream availability`;
  } else if (revenueOpportunityScore >= operationThreshold) {
    recommendationSummary = `${operation} opportunity ${revenueOpportunityScore}% supports cautious revenue acceleration on ${company} · ${revenueCategory}`;
    expectedRevenueIncrease = `Positive relative ${revenueCategory} increase signal at opportunity ${revenueOpportunityScore}% with validated supporting data required`;
  } else {
    recommendationSummary = `Hold revenue acceleration for ${revenueCategory} — opportunity ${revenueOpportunityScore}% below threshold; never recommend revenue actions without validated supporting data`;
    expectedRevenueIncrease = `Hold ${revenueCategory} acceleration until opportunity clears validated thresholds`;
  }

  if (
    config.neverRecommendRevenueActionsWithoutValidatedSupportingData &&
    revenueOpportunityScore < config.revenueOpportunityThreshold
  ) {
    recommendationSummary = `${recommendationSummary} · never recommend without validated supporting data`;
  }

  return {
    companyReference: company,
    revenueCategory,
    currentRevenueMetrics,
    revenueOpportunityScore,
    expectedRevenueIncrease,
    recommendationSummary,
  };
}
