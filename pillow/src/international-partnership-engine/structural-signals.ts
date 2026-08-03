/** X4-12 — Shared structural partnership scoring helpers (no live partner APIs). */

import { IPE_METADATA_VERSION } from "./paths.js";
import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import type {
  ApprovalStatus,
  PartnershipAnalysisInput,
  PartnershipCategory,
  PartnershipRecord,
  RiskLevel,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: PartnershipAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultPartner(input?: PartnershipAnalysisInput): string {
  return input?.partnerReference?.trim() || "partner-default";
}

export function defaultCountry(input?: PartnershipAnalysisInput): string {
  return (input?.country?.trim() || "SG").toUpperCase();
}

export function defaultCategory(input?: PartnershipAnalysisInput): PartnershipCategory {
  return input?.partnershipCategory ?? "strategic_partnership";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never approve strategic partnerships without validation.
 * "approved_validated" only when validated evidence clears thresholds.
 */
export function resolveApprovalStatus(
  performanceScore: number,
  reliabilityScore: number,
  riskDetected: boolean,
  validated: boolean,
  config: InternationalPartnershipEngineConfiguration,
): ApprovalStatus {
  if (!validated) return "unknown";
  if (riskDetected) return "rejected";
  if (
    performanceScore >= config.performanceThreshold &&
    reliabilityScore >= config.performanceThreshold
  ) {
    return "approved_validated";
  }
  if (performanceScore >= 40 || reliabilityScore >= 40) return "partial";
  return "under_review";
}

export function computeStructuralPartnershipSignals(
  input: PartnershipAnalysisInput,
  config: InternationalPartnershipEngineConfiguration,
): {
  companyReference: string;
  partnerReference: string;
  country: string;
  partnershipCategory: PartnershipCategory;
  performanceScore: number;
  reliabilityScore: number;
  recommendationSummary: string;
  approvalStatus: ApprovalStatus;
  riskLevel: RiskLevel;
  partnershipRiskDetected: boolean;
  partnershipOpportunityDetected: boolean;
  partnershipTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const partnerReference = defaultPartner(input);
  const country = defaultCountry(input);
  const partnershipCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${partnerReference}::${country}::${partnershipCategory}`;

  const performanceScore = Math.round(
    input.performanceHint ?? hashScore(`${seed}:perf`, 30, 95),
  );
  const reliabilityScore = Math.round(
    input.reliabilityHint ?? hashScore(`${seed}:rel`, 25, 92),
  );
  const partnershipRiskDetected =
    input.riskHint === true ||
    performanceScore < config.performanceThreshold - 10 ||
    reliabilityScore < config.performanceThreshold - 10;
  const partnershipOpportunityDetected =
    input.opportunityHint === true ||
    (validated &&
      performanceScore >= config.performanceThreshold + 10 &&
      reliabilityScore >= config.performanceThreshold);

  const approvalStatus = resolveApprovalStatus(
    performanceScore,
    reliabilityScore,
    partnershipRiskDetected,
    validated,
    config,
  );
  const riskScore = Math.max(
    0,
    100 - Math.round((performanceScore + reliabilityScore) / 2),
  );
  const riskLevel = riskLevelFromScore(riskScore);
  const partnershipTraceId = `ipe-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated partnership signal for ${partnerReference}/${country} — approval blocked`
    : partnershipRiskDetected
      ? `Mitigate partnership risk with ${partnerReference} in ${country}`
      : partnershipOpportunityDetected
        ? `Pursue partnership opportunity with ${partnerReference} in ${country}`
        : `Maintain ${partnershipCategory} with ${partnerReference} in ${country}`;

  return {
    companyReference,
    partnerReference,
    country,
    partnershipCategory,
    performanceScore: Math.max(0, Math.min(100, performanceScore)),
    reliabilityScore: Math.max(0, Math.min(100, reliabilityScore)),
    recommendationSummary,
    approvalStatus,
    riskLevel,
    partnershipRiskDetected,
    partnershipOpportunityDetected,
    partnershipTraceId,
  };
}

export function buildPartnershipRecord(
  signals: ReturnType<typeof computeStructuralPartnershipSignals>,
  validationStatus: PartnershipRecord["validationStatus"] = "passed",
): PartnershipRecord {
  return {
    partnershipId: `ipe-${Date.now()}-${signals.partnerReference}-${signals.country}-${signals.partnershipCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    partnerReference: signals.partnerReference,
    country: signals.country,
    partnershipCategory: signals.partnershipCategory,
    performanceScore: signals.performanceScore,
    reliabilityScore: signals.reliabilityScore,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: IPE_METADATA_VERSION,
    approvalStatus: signals.approvalStatus,
    riskLevel: signals.riskLevel,
    partnershipRiskDetected: signals.partnershipRiskDetected,
    partnershipOpportunityDetected: signals.partnershipOpportunityDetected,
    partnershipTraceId: signals.partnershipTraceId,
    structuralSignalOnly: true,
    neverApproveStrategicPartnershipsWithoutValidation: true,
    unvalidatedApprovalClaim: "none",
  };
}
