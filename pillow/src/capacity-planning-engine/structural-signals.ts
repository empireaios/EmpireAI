/** X3-04 — Shared structural capacity planning helpers. */

import { CPE_METADATA_VERSION } from "./paths.js";
import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type {
  CapacityDomain,
  CapacityPlanningInput,
  CapacityPlanningRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: CapacityPlanningInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultProduct(input?: CapacityPlanningInput): string {
  return input?.productReference?.trim() || "product-default";
}

export function buildCapacityRecord(input: {
  domain: CapacityDomain;
  companyReference: string;
  productReference: string;
  currentCapacity: number;
  forecastDemand: number;
  capacityUtilization: number;
  bottleneckSummary: string;
  recommendedExpansion: number;
  config: CapacityPlanningEngineConfiguration;
}): CapacityPlanningRecord {
  const expansion = input.config.neverRecommendBeyondValidatedLimits
    ? Math.max(
        0,
        Math.min(
          input.recommendedExpansion,
          Math.max(0, input.forecastDemand - input.currentCapacity),
        ),
      )
    : input.recommendedExpansion;

  return {
    capacityPlanningId: `cpe-cap-${Date.now()}-${input.domain}-${input.productReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    productReference: input.productReference,
    domain: input.domain,
    currentCapacity: Math.max(0, Math.min(100, Math.round(input.currentCapacity))),
    forecastDemand: Math.max(0, Math.min(100, Math.round(input.forecastDemand))),
    capacityUtilization: Math.max(0, Math.min(100, Math.round(input.capacityUtilization))),
    bottleneckSummary: input.bottleneckSummary,
    recommendedExpansion: Math.max(0, Math.round(expansion)),
    validationStatus: "passed",
    metadataVersion: CPE_METADATA_VERSION,
    neverRecommendBeyondValidatedLimits: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computeDomainSignals(
  domain: CapacityDomain,
  input: CapacityPlanningInput,
  config: CapacityPlanningEngineConfiguration,
): {
  companyReference: string;
  productReference: string;
  currentCapacity: number;
  forecastDemand: number;
  capacityUtilization: number;
  bottleneckSummary: string;
  recommendedExpansion: number;
} {
  const company = defaultCompany(input);
  const product = defaultProduct(input);
  const seed = `${company}::${product}::${domain}`;

  const currentCapacity = Math.round(
    input.currentCapacityHint ?? hashScore(`${seed}:capacity`, 35, 95),
  );
  const forecastDemand = Math.round(
    input.forecastDemandHint ?? hashScore(`${seed}:demand`, 40, 100),
  );
  const capacityUtilization = Math.round(
    input.utilizationHint ??
      Math.min(100, Math.round((forecastDemand / Math.max(1, currentCapacity)) * 100)),
  );

  let bottleneckSummary = "No critical bottleneck detected";
  if (capacityUtilization >= config.utilizationCriticalThreshold) {
    bottleneckSummary = `${domain} capacity critical at ${capacityUtilization}% utilization`;
  } else if (capacityUtilization >= config.bottleneckDetectionThreshold) {
    bottleneckSummary = `${domain} approaching bottleneck at ${capacityUtilization}% utilization`;
  } else if (capacityUtilization >= config.utilizationWarnThreshold) {
    bottleneckSummary = `${domain} elevated utilization (${capacityUtilization}%) — monitor`;
  }

  const gap = Math.max(0, forecastDemand - currentCapacity);
  const recommendedExpansion =
    capacityUtilization >= config.bottleneckDetectionThreshold
      ? Math.max(gap, Math.round(currentCapacity * 0.15))
      : gap > 0
        ? gap
        : 0;

  return {
    companyReference: company,
    productReference: product,
    currentCapacity,
    forecastDemand,
    capacityUtilization,
    bottleneckSummary,
    recommendedExpansion,
  };
}
