/** X4-06 — Shared structural compliance scoring helpers (no live regulatory APIs). */

import { RCE_METADATA_VERSION } from "./paths.js";
import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type {
  ComplianceAnalysisInput,
  ComplianceRecord,
  ComplianceStatus,
  RegulationCategory,
  RiskLevel,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: ComplianceAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCountry(input?: ComplianceAnalysisInput): string {
  return (input?.country?.trim() || "SG").toUpperCase();
}

export function defaultCategory(input?: ComplianceAnalysisInput): RegulationCategory {
  return input?.regulationCategory ?? "country_specific";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never falsely certify compliance: "aligned" only when validated evidence exists
 * and alignment clears threshold; never emit certification claims.
 */
export function resolveComplianceStatus(
  alignmentScore: number,
  riskScore: number,
  violationDetected: boolean,
  validated: boolean,
  config: RegionalComplianceEngineConfiguration,
): ComplianceStatus {
  if (!validated) return "unknown";
  if (violationDetected) return "gap";
  if (riskScore >= config.riskThreshold + 20) return "gap";
  if (alignmentScore >= 75 && riskScore < config.riskThreshold) return "aligned";
  if (alignmentScore >= 50) return "partial";
  return "under_review";
}

export function computeStructuralComplianceSignals(
  input: ComplianceAnalysisInput,
  config: RegionalComplianceEngineConfiguration,
): {
  companyReference: string;
  country: string;
  regulationCategory: RegulationCategory;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  requiredActions: string[];
  riskScore: number;
  alignmentScore: number;
  violationDetected: boolean;
} {
  const companyReference = defaultCompany(input);
  const country = defaultCountry(input);
  const regulationCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${country}::${regulationCategory}`;

  const alignmentScore = Math.round(
    input.alignmentHint ?? hashScore(`${seed}:align`, 35, 92),
  );
  const riskScore = Math.round(
    input.riskHint ?? Math.max(0, 100 - alignmentScore + hashScore(`${seed}:risk`, 0, 20)),
  );
  const violationDetected =
    input.violationHint === true ||
    riskScore >= config.riskThreshold + 25 ||
    alignmentScore < 40;

  const complianceStatus = resolveComplianceStatus(
    alignmentScore,
    riskScore,
    violationDetected,
    validated,
    config,
  );
  const riskLevel = riskLevelFromScore(riskScore);

  const requiredActions: string[] = [];
  if (!validated) {
    requiredActions.push("Provide validated compliance evidence before alignment claims");
  }
  if (violationDetected) {
    requiredActions.push(`Remediate ${regulationCategory} gap in ${country}`);
  }
  if (riskScore >= config.riskThreshold) {
    requiredActions.push(`Reduce ${riskLevel} risk for ${country}/${regulationCategory}`);
  }
  if (complianceStatus === "partial" || complianceStatus === "under_review") {
    requiredActions.push("Complete regional compliance review with legal/ops owners");
  }
  if (requiredActions.length === 0) {
    requiredActions.push("Maintain monitored posture — no false certification issued");
  }

  return {
    companyReference,
    country,
    regulationCategory,
    complianceStatus,
    riskLevel,
    requiredActions,
    riskScore: Math.max(0, Math.min(100, riskScore)),
    alignmentScore: Math.max(0, Math.min(100, alignmentScore)),
    violationDetected,
  };
}

export function buildComplianceRecord(
  signals: ReturnType<typeof computeStructuralComplianceSignals>,
  validationStatus: ComplianceRecord["validationStatus"] = "passed",
): ComplianceRecord {
  return {
    complianceRecordId: `rce-${Date.now()}-${signals.country}-${signals.regulationCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    country: signals.country,
    regulationCategory: signals.regulationCategory,
    complianceStatus: signals.complianceStatus,
    riskLevel: signals.riskLevel,
    requiredActions: [...signals.requiredActions],
    validationStatus,
    metadataVersion: RCE_METADATA_VERSION,
    riskScore: signals.riskScore,
    alignmentScore: signals.alignmentScore,
    violationDetected: signals.violationDetected,
    structuralSignalOnly: true,
    neverFalselyCertifyCompliance: true,
    certificationClaim: "none",
  };
}
