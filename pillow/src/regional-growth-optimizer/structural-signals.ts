/** X4-14 — Shared structural regional optimization helpers (no live market APIs). */

import { RGO_METADATA_VERSION } from "./paths.js";
import type { RegionalGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  OptimizationCategory,
  OptimizationStatus,
  PriorityLevel,
  RegionalOptimizationInput,
  RegionalOptimizationRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: RegionalOptimizationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultRegion(input?: RegionalOptimizationInput): string {
  return (input?.region?.trim() || "APAC").toUpperCase();
}

export function defaultCategory(input?: RegionalOptimizationInput): OptimizationCategory {
  return input?.optimizationCategory ?? "regional_business_performance";
}

export function priorityFromScore(score: number): PriorityLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never optimize using unvalidated regional intelligence.
 * "validated_ready" only when validated evidence clears thresholds.
 */
export function resolveOptimizationStatus(
  revenueScore: number,
  profitabilityScore: number,
  bottleneckDetected: boolean,
  validated: boolean,
  config: RegionalGrowthOptimizerConfiguration,
): OptimizationStatus {
  if (!validated) return "unknown";
  if (bottleneckDetected) return "rejected";
  if (
    revenueScore >= config.performanceThreshold &&
    profitabilityScore >= config.performanceThreshold
  ) {
    return "validated_ready";
  }
  if (revenueScore >= 40 || profitabilityScore >= 40) return "partial";
  return "under_review";
}

export function computeStructuralRegionalSignals(
  input: RegionalOptimizationInput,
  config: RegionalGrowthOptimizerConfiguration,
): {
  companyReference: string;
  region: string;
  optimizationCategory: OptimizationCategory;
  revenueScore: number;
  profitabilityScore: number;
  customerGrowthScore: number;
  optimizationPriority: PriorityLevel;
  recommendationSummary: string;
  optimizationStatus: OptimizationStatus;
  growthOpportunityDetected: boolean;
  bottleneckDetected: boolean;
  optimizationTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const region = defaultRegion(input);
  const optimizationCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${region}::${optimizationCategory}`;

  const revenueScore = Math.round(input.revenueHint ?? hashScore(`${seed}:rev`, 30, 95));
  const profitabilityScore = Math.round(
    input.profitabilityHint ?? hashScore(`${seed}:profit`, 25, 92),
  );
  const customerGrowthScore = Math.round(
    input.customerGrowthHint ?? hashScore(`${seed}:cust`, 20, 90),
  );
  const efficiencyScore = Math.round(
    input.efficiencyHint ?? hashScore(`${seed}:eff`, 20, 90),
  );

  const bottleneckDetected =
    input.bottleneckHint === true ||
    revenueScore < config.performanceThreshold - 10 ||
    profitabilityScore < config.performanceThreshold - 10 ||
    efficiencyScore < config.performanceThreshold - 10;
  const growthOpportunityDetected =
    input.opportunityHint === true ||
    (validated &&
      revenueScore >= config.performanceThreshold + 10 &&
      customerGrowthScore >= config.performanceThreshold);

  const optimizationStatus = resolveOptimizationStatus(
    revenueScore,
    profitabilityScore,
    bottleneckDetected,
    validated,
    config,
  );
  const priorityScore = Math.max(
    0,
    100 - Math.round((revenueScore + profitabilityScore + customerGrowthScore) / 3),
  );
  const optimizationPriority = priorityFromScore(
    bottleneckDetected ? Math.max(priorityScore, 70) : priorityScore,
  );
  const optimizationTraceId = `rgo-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated regional signal for ${region} — optimization blocked`
    : bottleneckDetected
      ? `Resolve performance bottleneck in ${region}`
      : growthOpportunityDetected
        ? `Pursue growth opportunity in ${region}`
        : `Maintain ${optimizationCategory} posture in ${region}`;

  return {
    companyReference,
    region,
    optimizationCategory,
    revenueScore: Math.max(0, Math.min(100, revenueScore)),
    profitabilityScore: Math.max(0, Math.min(100, profitabilityScore)),
    customerGrowthScore: Math.max(0, Math.min(100, customerGrowthScore)),
    optimizationPriority,
    recommendationSummary,
    optimizationStatus,
    growthOpportunityDetected,
    bottleneckDetected,
    optimizationTraceId,
  };
}

export function buildOptimizationRecord(
  signals: ReturnType<typeof computeStructuralRegionalSignals>,
  validationStatus: RegionalOptimizationRecord["validationStatus"] = "passed",
): RegionalOptimizationRecord {
  return {
    regionalOptimizationId: `rgo-${Date.now()}-${signals.region}-${signals.optimizationCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    region: signals.region,
    revenueScore: signals.revenueScore,
    profitabilityScore: signals.profitabilityScore,
    customerGrowthScore: signals.customerGrowthScore,
    optimizationPriority: signals.optimizationPriority,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: RGO_METADATA_VERSION,
    optimizationCategory: signals.optimizationCategory,
    optimizationStatus: signals.optimizationStatus,
    growthOpportunityDetected: signals.growthOpportunityDetected,
    bottleneckDetected: signals.bottleneckDetected,
    optimizationTraceId: signals.optimizationTraceId,
    structuralSignalOnly: true,
    neverOptimizeUsingUnvalidatedRegionalIntelligence: true,
    unvalidatedOptimizationClaim: "none",
  };
}
