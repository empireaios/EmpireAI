/** X3-12 — Shared structural performance preservation helpers. */

import { PPE_METADATA_VERSION } from "./paths.js";
import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type {
  PreservationOperation,
  PreservationRecord,
  PerformancePreservationInput,
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

export function defaultCompany(input?: PerformancePreservationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultComponent(input?: PerformancePreservationInput): string {
  return input?.operationalComponent?.trim() || "ops-component-default";
}

export function buildPreservationRecord(input: {
  companyReference: string;
  operationalComponent: string;
  performanceScore: number;
  qualityScore: number;
  customerExperienceScore: number;
  detectedDegradation: boolean;
  recommendationSummary: string;
  config: PerformancePreservationEngineConfiguration;
}): PreservationRecord {
  const performanceScore = clampScore(input.performanceScore);
  const qualityScore = clampScore(input.qualityScore);
  // Never invent lower CX to justify scale — preserve observed customer experience score.
  const customerExperienceScore = clampScore(input.customerExperienceScore);

  return {
    performancePreservationId: `ppe-pr-${Date.now()}-${input.operationalComponent.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    operationalComponent: input.operationalComponent,
    performanceScore,
    qualityScore,
    customerExperienceScore,
    detectedDegradation: input.detectedDegradation,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: PPE_METADATA_VERSION,
    neverCompromiseCustomerExperienceForScaling: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computePreservationSignals(
  operation: PreservationOperation,
  input: PerformancePreservationInput,
  config: PerformancePreservationEngineConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  operationalComponent: string;
  performanceScore: number;
  qualityScore: number;
  customerExperienceScore: number;
  detectedDegradation: boolean;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const component = defaultComponent(input);
  const seed = `${company}::${component}::${operation}`;

  const performanceScore = clampScore(
    input.performanceHint ?? hashScore(`${seed}:performance`, 25, 95),
  );
  const qualityScore = clampScore(
    input.qualityHint ?? hashScore(`${seed}:quality`, 25, 95),
  );
  const customerExperienceScore = clampScore(
    input.customerExperienceHint ?? hashScore(`${seed}:cx`, 30, 95),
  );
  const responseTimeScore = clampScore(
    input.responseTimeHint ?? hashScore(`${seed}:response`, 25, 95),
  );
  const reliabilityScore = clampScore(
    input.reliabilityHint ?? hashScore(`${seed}:reliability`, 25, 95),
  );

  let detectedDegradation =
    performanceScore <= config.degradationThreshold ||
    qualityScore <= config.degradationThreshold ||
    customerExperienceScore <= config.customerExperienceThreshold - 15;

  let recommendationSummary =
    "Preservation signals within quality bounds — structural signals only; never compromise CX for scaling";

  if (!sourceAvailable) {
    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only`;
    detectedDegradation = detectedDegradation || qualityScore < config.qualityThreshold;
  } else if (operation === "service_quality" && qualityScore < config.qualityThreshold) {
    detectedDegradation = true;
    recommendationSummary = `Service quality ${qualityScore}% below threshold ${config.qualityThreshold} on ${component} — preserve quality before further scale`;
  } else if (
    operation === "customer_experience" &&
    customerExperienceScore < config.customerExperienceThreshold
  ) {
    detectedDegradation = true;
    recommendationSummary = `Customer experience ${customerExperienceScore}% below threshold ${config.customerExperienceThreshold} on ${component} — never compromise CX for scaling`;
  } else if (
    operation === "operational_performance" &&
    performanceScore < config.performanceThreshold
  ) {
    detectedDegradation = true;
    recommendationSummary = `Operational performance ${performanceScore}% below threshold ${config.performanceThreshold} on ${component}`;
  } else if (operation === "response_time" && responseTimeScore < config.responseTimeThreshold) {
    detectedDegradation = true;
    recommendationSummary = `Response-time structural score ${responseTimeScore}% below threshold ${config.responseTimeThreshold} on ${component}`;
  } else if (
    operation === "fulfilment_quality" &&
    qualityScore < config.qualityThreshold
  ) {
    detectedDegradation = true;
    recommendationSummary = `Fulfilment quality ${qualityScore}% below threshold ${config.qualityThreshold} on ${component}`;
  } else if (operation === "reliability" && reliabilityScore < config.reliabilityThreshold) {
    detectedDegradation = true;
    recommendationSummary = `Reliability ${reliabilityScore}% below threshold ${config.reliabilityThreshold} on ${component}`;
  } else if (operation === "performance_degradation") {
    detectedDegradation =
      performanceScore <= config.degradationThreshold ||
      customerExperienceScore < config.customerExperienceThreshold;
    recommendationSummary = detectedDegradation
      ? `Performance degradation detected · perf ${performanceScore}% · CX ${customerExperienceScore}% — preserve quality before scaling`
      : `No structural performance degradation on ${component} · perf ${performanceScore}%`;
  } else if (operation === "quality_regression") {
    detectedDegradation = qualityScore <= config.regressionThreshold;
    recommendationSummary = detectedDegradation
      ? `Quality regression detected at ${qualityScore}% (threshold ${config.regressionThreshold}) — hold scale until quality recovers`
      : `Quality ${qualityScore}% above regression floor ${config.regressionThreshold} on ${component}`;
  } else {
    recommendationSummary = `Validated ${operation} signals support cautious performance preservation`;
  }

  if (config.neverCompromiseCustomerExperienceForScaling && detectedDegradation) {
    recommendationSummary = `${recommendationSummary} · never compromise customer experience for scaling`;
  }

  return {
    companyReference: company,
    operationalComponent: component,
    performanceScore,
    qualityScore,
    customerExperienceScore,
    detectedDegradation,
    recommendationSummary,
  };
}
