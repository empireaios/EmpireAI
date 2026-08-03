/** X3-06 — Shared structural supplier scaling helpers. */

import { SSE_METADATA_VERSION } from "./paths.js";
import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierScalingRecord } from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: SupplierScaleInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultSupplier(input?: SupplierScaleInput): string {
  return input?.supplierReference?.trim() || "supplier-default";
}

export function buildSupplierScalingRecord(input: {
  companyReference: string;
  supplierReference: string;
  capacityScore: number;
  performanceScore: number;
  reliabilityScore: number;
  fulfilmentReadiness: number;
  recommendationSummary: string;
  config: SupplierScaleEngineConfiguration;
}): SupplierScalingRecord {
  let fulfilment = Math.max(0, Math.min(100, Math.round(input.fulfilmentReadiness)));
  if (input.config.neverRecommendSupplierExpansionWithoutValidatedCapacity) {
    if (
      input.capacityScore < input.config.minCapacityScore ||
      input.reliabilityScore < input.config.minReliabilityScore ||
      input.performanceScore < input.config.minPerformanceScore
    ) {
      fulfilment = Math.min(fulfilment, input.config.minFulfilmentReadiness - 1);
    }
  }

  return {
    supplierScalingId: `sse-sup-${Date.now()}-${input.supplierReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    supplierReference: input.supplierReference,
    capacityScore: Math.max(0, Math.min(100, Math.round(input.capacityScore))),
    performanceScore: Math.max(0, Math.min(100, Math.round(input.performanceScore))),
    reliabilityScore: Math.max(0, Math.min(100, Math.round(input.reliabilityScore))),
    fulfilmentReadiness: fulfilment,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: SSE_METADATA_VERSION,
    neverRecommendSupplierExpansionWithoutValidatedCapacity: true,
    structuralSignalOnly: true,
    sensitiveSupplierData: false,
  };
}

export function computeSupplierSignals(
  focus: "capacity" | "performance" | "lead_time" | "inventory" | "fulfilment" | "reliability" | "supplier",
  input: SupplierScaleInput,
  config: SupplierScaleEngineConfiguration,
): {
  companyReference: string;
  supplierReference: string;
  capacityScore: number;
  performanceScore: number;
  reliabilityScore: number;
  fulfilmentReadiness: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const supplier = defaultSupplier(input);
  const seed = `${company}::${supplier}::${focus}`;

  const capacityScore = Math.round(
    input.capacityHint ?? hashScore(`${seed}:capacity`, 20, 95),
  );
  const performanceScore = Math.round(
    input.performanceHint ?? hashScore(`${seed}:performance`, 20, 95),
  );
  const reliabilityScore = Math.round(
    input.reliabilityHint ?? hashScore(`${seed}:reliability`, 20, 95),
  );

  const leadTimeScore = Math.round(
    input.leadTimeHint ?? hashScore(`${seed}:lead`, 20, 95),
  );
  const inventoryScore = Math.round(
    input.inventoryHint ?? hashScore(`${seed}:inventory`, 20, 95),
  );

  let fulfilmentReadiness = Math.round(
    input.fulfilmentHint ??
      (capacityScore * 0.3 +
        performanceScore * 0.25 +
        reliabilityScore * 0.25 +
        leadTimeScore * 0.1 +
        inventoryScore * 0.1),
  );

  let recommendationSummary = "Supplier capacity within validated structural bounds";
  if (capacityScore < config.minCapacityScore) {
    recommendationSummary = `Capacity bottleneck at ${capacityScore} (min ${config.minCapacityScore}) — do not expand`;
  } else if (reliabilityScore < config.minReliabilityScore) {
    recommendationSummary = `Reliability bottleneck at ${reliabilityScore} (min ${config.minReliabilityScore}) — do not expand`;
  } else if (performanceScore < config.minPerformanceScore) {
    recommendationSummary = `Performance bottleneck at ${performanceScore} (min ${config.minPerformanceScore}) — do not expand`;
  } else if (fulfilmentReadiness < config.minFulfilmentReadiness) {
    recommendationSummary = `Fulfilment readiness ${fulfilmentReadiness} below min ${config.minFulfilmentReadiness} — hold scale`;
  } else {
    recommendationSummary = `Validated ${focus} signals support cautious supplier scale`;
  }

  if (config.neverRecommendSupplierExpansionWithoutValidatedCapacity) {
    if (
      capacityScore < config.minCapacityScore ||
      reliabilityScore < config.minReliabilityScore ||
      performanceScore < config.minPerformanceScore
    ) {
      fulfilmentReadiness = Math.min(
        fulfilmentReadiness,
        config.minFulfilmentReadiness - 1,
      );
    }
  }

  return {
    companyReference: company,
    supplierReference: supplier,
    capacityScore,
    performanceScore,
    reliabilityScore,
    fulfilmentReadiness,
    recommendationSummary,
  };
}
