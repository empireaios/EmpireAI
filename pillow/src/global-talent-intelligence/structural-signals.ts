/** X4-13 — Shared structural workforce scoring helpers (no live HR APIs). */

import { TAL_METADATA_VERSION } from "./paths.js";
import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type {
  DecisionStatus,
  RiskLevel,
  WorkforceAnalysisInput,
  WorkforceCategory,
  WorkforceIntelligenceRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: WorkforceAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultRegion(input?: WorkforceAnalysisInput): string {
  return (input?.region?.trim() || "APAC").toUpperCase();
}

export function defaultCategory(input?: WorkforceAnalysisInput): WorkforceCategory {
  return input?.workforceCategory ?? "global_workforce_availability";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never make workforce decisions using unvalidated intelligence.
 * "validated_ready" only when validated evidence clears thresholds.
 */
export function resolveDecisionStatus(
  capabilityScore: number,
  availabilityScore: number,
  shortageDetected: boolean,
  validated: boolean,
  config: GlobalTalentIntelligenceConfiguration,
): DecisionStatus {
  if (!validated) return "unknown";
  if (shortageDetected) return "rejected";
  if (
    capabilityScore >= config.capabilityThreshold &&
    availabilityScore >= config.capabilityThreshold
  ) {
    return "validated_ready";
  }
  if (capabilityScore >= 40 || availabilityScore >= 40) return "partial";
  return "under_review";
}

export function computeStructuralWorkforceSignals(
  input: WorkforceAnalysisInput,
  config: GlobalTalentIntelligenceConfiguration,
): {
  companyReference: string;
  region: string;
  workforceCategory: WorkforceCategory;
  capabilityScore: number;
  availabilityScore: number;
  utilizationScore: number;
  recommendationSummary: string;
  decisionStatus: DecisionStatus;
  riskLevel: RiskLevel;
  workforceShortageDetected: boolean;
  workforceOpportunityDetected: boolean;
  workforceTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const region = defaultRegion(input);
  const workforceCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${region}::${workforceCategory}`;

  const capabilityScore = Math.round(
    input.capabilityHint ?? hashScore(`${seed}:cap`, 30, 95),
  );
  const availabilityScore = Math.round(
    input.availabilityHint ?? hashScore(`${seed}:avail`, 25, 92),
  );
  const utilizationScore = Math.round(
    input.utilizationHint ?? hashScore(`${seed}:util`, 20, 90),
  );
  const workforceShortageDetected =
    input.shortageHint === true ||
    availabilityScore < config.capabilityThreshold - 10 ||
    capabilityScore < config.capabilityThreshold - 10;
  const workforceOpportunityDetected =
    input.opportunityHint === true ||
    (validated &&
      capabilityScore >= config.capabilityThreshold + 10 &&
      availabilityScore >= config.capabilityThreshold);

  const decisionStatus = resolveDecisionStatus(
    capabilityScore,
    availabilityScore,
    workforceShortageDetected,
    validated,
    config,
  );
  const riskScore = Math.max(
    0,
    100 - Math.round((capabilityScore + availabilityScore) / 2),
  );
  const riskLevel = riskLevelFromScore(riskScore);
  const workforceTraceId = `tal-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated workforce signal for ${region} — decisions blocked`
    : workforceShortageDetected
      ? `Address workforce shortage in ${region}`
      : workforceOpportunityDetected
        ? `Pursue workforce opportunity in ${region}`
        : `Maintain ${workforceCategory} posture in ${region}`;

  return {
    companyReference,
    region,
    workforceCategory,
    capabilityScore: Math.max(0, Math.min(100, capabilityScore)),
    availabilityScore: Math.max(0, Math.min(100, availabilityScore)),
    utilizationScore: Math.max(0, Math.min(100, utilizationScore)),
    recommendationSummary,
    decisionStatus,
    riskLevel,
    workforceShortageDetected,
    workforceOpportunityDetected,
    workforceTraceId,
  };
}

export function buildWorkforceRecord(
  signals: ReturnType<typeof computeStructuralWorkforceSignals>,
  validationStatus: WorkforceIntelligenceRecord["validationStatus"] = "passed",
): WorkforceIntelligenceRecord {
  return {
    workforceIntelligenceId: `tal-${Date.now()}-${signals.region}-${signals.workforceCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    region: signals.region,
    workforceCategory: signals.workforceCategory,
    capabilityScore: signals.capabilityScore,
    availabilityScore: signals.availabilityScore,
    utilizationScore: signals.utilizationScore,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: TAL_METADATA_VERSION,
    decisionStatus: signals.decisionStatus,
    riskLevel: signals.riskLevel,
    workforceShortageDetected: signals.workforceShortageDetected,
    workforceOpportunityDetected: signals.workforceOpportunityDetected,
    workforceTraceId: signals.workforceTraceId,
    structuralSignalOnly: true,
    neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true,
    unvalidatedDecisionClaim: "none",
  };
}
