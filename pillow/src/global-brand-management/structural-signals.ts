/** X4-11 — Shared structural brand scoring helpers (no live brand asset APIs). */

import { GBM_METADATA_VERSION } from "./paths.js";
import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import type {
  BrandAnalysisInput,
  BrandCategory,
  BrandGovernanceRecord,
  ComplianceStatus,
  RiskLevel,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: BrandAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultBrand(input?: BrandAnalysisInput): string {
  return input?.brandReference?.trim() || "brand-default";
}

export function defaultRegion(input?: BrandAnalysisInput): string {
  return (input?.region?.trim() || "APAC").toUpperCase();
}

export function defaultCategory(input?: BrandAnalysisInput): BrandCategory {
  return input?.brandCategory ?? "worldwide_identity";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never modify protected brand assets without authorization.
 */
export function resolveComplianceStatus(
  consistencyScore: number,
  reputationScore: number,
  inconsistencyDetected: boolean,
  reputationRiskDetected: boolean,
  validated: boolean,
  config: GlobalBrandManagementConfiguration,
): ComplianceStatus {
  if (!validated) return "unknown";
  if (inconsistencyDetected || reputationRiskDetected) return "gap";
  if (reputationScore < config.reputationThreshold) return "partial";
  if (consistencyScore >= 75 && reputationScore >= config.reputationThreshold) return "aligned";
  if (consistencyScore >= 50) return "partial";
  return "under_review";
}

export function computeStructuralBrandSignals(
  input: BrandAnalysisInput,
  config: GlobalBrandManagementConfiguration,
): {
  companyReference: string;
  brandReference: string;
  region: string;
  brandCategory: BrandCategory;
  brandConsistencyScore: number;
  reputationScore: number;
  complianceStatus: ComplianceStatus;
  recommendationSummary: string;
  riskLevel: RiskLevel;
  inconsistencyDetected: boolean;
  reputationRiskDetected: boolean;
  protectedAssetModificationAttempted: boolean;
  brandTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const brandReference = defaultBrand(input);
  const region = defaultRegion(input);
  const brandCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${brandReference}::${region}::${brandCategory}`;

  const brandConsistencyScore = Math.round(
    input.consistencyHint ?? hashScore(`${seed}:consistency`, 35, 95),
  );
  const reputationScore = Math.round(
    input.reputationHint ?? hashScore(`${seed}:reputation`, 25, 92),
  );
  const inconsistencyDetected =
    input.inconsistencyHint === true || brandConsistencyScore < 45;
  const reputationRiskDetected =
    input.reputationRiskHint === true || reputationScore < config.reputationThreshold;
  const protectedAssetModificationAttempted =
    input.authorizeProtectedAssetModification === true;

  const complianceStatus = resolveComplianceStatus(
    brandConsistencyScore,
    reputationScore,
    inconsistencyDetected,
    reputationRiskDetected,
    validated,
    config,
  );
  const riskScore = Math.max(
    0,
    100 - Math.round((brandConsistencyScore + reputationScore) / 2),
  );
  const riskLevel = riskLevelFromScore(riskScore);
  const brandTraceId = `gbm-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated brand signal for ${brandReference}/${region} — governance blocked`
    : inconsistencyDetected
      ? `Resolve brand inconsistency for ${brandReference} in ${region}`
      : reputationRiskDetected
        ? `Mitigate reputation risk for ${brandReference} (score=${reputationScore})`
        : `Maintain ${brandCategory} governance for ${brandReference} in ${region}`;

  return {
    companyReference,
    brandReference,
    region,
    brandCategory,
    brandConsistencyScore: Math.max(0, Math.min(100, brandConsistencyScore)),
    reputationScore: Math.max(0, Math.min(100, reputationScore)),
    complianceStatus,
    recommendationSummary,
    riskLevel,
    inconsistencyDetected,
    reputationRiskDetected,
    protectedAssetModificationAttempted,
    brandTraceId,
  };
}

export function buildBrandGovernanceRecord(
  signals: ReturnType<typeof computeStructuralBrandSignals>,
  validationStatus: BrandGovernanceRecord["validationStatus"] = "passed",
): BrandGovernanceRecord {
  return {
    brandGovernanceId: `gbm-${Date.now()}-${signals.brandReference}-${signals.region}-${signals.brandCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    brandReference: signals.brandReference,
    region: signals.region,
    brandConsistencyScore: signals.brandConsistencyScore,
    reputationScore: signals.reputationScore,
    complianceStatus: signals.complianceStatus,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: GBM_METADATA_VERSION,
    brandCategory: signals.brandCategory,
    riskLevel: signals.riskLevel,
    inconsistencyDetected: signals.inconsistencyDetected,
    reputationRiskDetected: signals.reputationRiskDetected,
    protectedAssetModificationAttempted: signals.protectedAssetModificationAttempted,
    brandTraceId: signals.brandTraceId,
    structuralSignalOnly: true,
    neverModifyProtectedBrandAssetsWithoutAuthorization: true,
    protectedAssetModificationClaim: "none",
  };
}
