/** X4-08 — Shared structural logistics scoring helpers (no live carrier APIs). */

import { ILE_METADATA_VERSION } from "./paths.js";
import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type {
  FulfillmentStatus,
  LogisticsAnalysisInput,
  LogisticsCategory,
  LogisticsRecord,
  RiskLevel,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: LogisticsAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultOrigin(input?: LogisticsAnalysisInput): string {
  return (input?.originRegion?.trim() || "APAC").toUpperCase();
}

export function defaultDestination(input?: LogisticsAnalysisInput): string {
  return (input?.destinationRegion?.trim() || "EU").toUpperCase();
}

export function defaultProvider(input?: LogisticsAnalysisInput): string {
  return input?.logisticsProvider?.trim() || "provider-structural";
}

export function defaultCategory(input?: LogisticsAnalysisInput): LogisticsCategory {
  return input?.logisticsCategory ?? "shipping_network";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never generate shipping recommendations using unvalidated logistics data.
 */
export function resolveFulfillmentStatus(
  deliveryPerformance: number,
  riskScore: number,
  bottleneckDetected: boolean,
  fulfillmentRiskDetected: boolean,
  validated: boolean,
  config: InternationalLogisticsEngineConfiguration,
): FulfillmentStatus {
  if (!validated) return "unknown";
  if (bottleneckDetected || fulfillmentRiskDetected) return "constrained";
  if (deliveryPerformance > config.deliveryThreshold || riskScore >= 70) return "partial";
  if (deliveryPerformance <= config.deliveryThreshold && riskScore < 50) return "ready";
  return "under_review";
}

export function computeStructuralLogisticsSignals(
  input: LogisticsAnalysisInput,
  config: InternationalLogisticsEngineConfiguration,
): {
  companyReference: string;
  originRegion: string;
  destinationRegion: string;
  logisticsProvider: string;
  logisticsCategory: LogisticsCategory;
  deliveryPerformance: number;
  shippingCost: number;
  fulfillmentStatus: FulfillmentStatus;
  recommendationSummary: string;
  riskLevel: RiskLevel;
  riskScore: number;
  bottleneckDetected: boolean;
  fulfillmentRiskDetected: boolean;
  routeOptimized: boolean;
  logisticsTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const originRegion = defaultOrigin(input);
  const destinationRegion = defaultDestination(input);
  const logisticsProvider = defaultProvider(input);
  const logisticsCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${originRegion}::${destinationRegion}::${logisticsCategory}`;

  const deliveryPerformance = Math.round(
    input.deliveryPerformanceHint ?? hashScore(`${seed}:delivery`, 24, 120),
  );
  const shippingCost = Math.round(
    input.shippingCostHint ?? hashScore(`${seed}:cost`, 50, 2500),
  );
  const riskScore = Math.round(input.riskHint ?? hashScore(`${seed}:risk`, 15, 90));
  const bottleneckDetected =
    input.bottleneckHint === true ||
    deliveryPerformance > config.deliveryThreshold + 24 ||
    riskScore >= 80;
  const fulfillmentRiskDetected =
    input.fulfillmentRiskHint === true || riskScore >= 75 || shippingCost > 2000;
  const routeOptimized =
    validated &&
    !bottleneckDetected &&
    deliveryPerformance <= config.deliveryThreshold;

  const fulfillmentStatus = resolveFulfillmentStatus(
    deliveryPerformance,
    riskScore,
    bottleneckDetected,
    fulfillmentRiskDetected,
    validated,
    config,
  );
  const riskLevel = riskLevelFromScore(riskScore);
  const logisticsTraceId = `ile-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated logistics signal ${originRegion}->${destinationRegion} — recommendations blocked`
    : bottleneckDetected
      ? `Resolve bottleneck on ${originRegion}->${destinationRegion} via ${logisticsProvider}`
      : fulfillmentRiskDetected
        ? `Mitigate fulfillment risk ${originRegion}->${destinationRegion} (${riskLevel})`
        : `Maintain ${logisticsCategory} posture ${originRegion}->${destinationRegion}`;

  return {
    companyReference,
    originRegion,
    destinationRegion,
    logisticsProvider,
    logisticsCategory,
    deliveryPerformance,
    shippingCost,
    fulfillmentStatus,
    recommendationSummary,
    riskLevel,
    riskScore: Math.max(0, Math.min(100, riskScore)),
    bottleneckDetected,
    fulfillmentRiskDetected,
    routeOptimized,
    logisticsTraceId,
  };
}

export function buildLogisticsRecord(
  signals: ReturnType<typeof computeStructuralLogisticsSignals>,
  validationStatus: LogisticsRecord["validationStatus"] = "passed",
): LogisticsRecord {
  return {
    logisticsRecordId: `ile-${Date.now()}-${signals.originRegion}-${signals.destinationRegion}-${signals.logisticsCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    originRegion: signals.originRegion,
    destinationRegion: signals.destinationRegion,
    logisticsProvider: signals.logisticsProvider,
    deliveryPerformance: signals.deliveryPerformance,
    shippingCost: signals.shippingCost,
    costUnit: "structural_units",
    fulfillmentStatus: signals.fulfillmentStatus,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: ILE_METADATA_VERSION,
    logisticsCategory: signals.logisticsCategory,
    riskLevel: signals.riskLevel,
    riskScore: signals.riskScore,
    bottleneckDetected: signals.bottleneckDetected,
    fulfillmentRiskDetected: signals.fulfillmentRiskDetected,
    routeOptimized: signals.routeOptimized,
    logisticsTraceId: signals.logisticsTraceId,
    structuralSignalOnly: true,
    neverRecommendWithUnvalidatedLogisticsData: true,
    unvalidatedRecommendationClaim: "none",
  };
}
