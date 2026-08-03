/** X4-07 — Shared structural tax scoring helpers (no live tax authority APIs). */

import { GTI_METADATA_VERSION } from "./paths.js";
import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type {
  ComplianceStatus,
  RiskLevel,
  TaxAnalysisInput,
  TaxCategory,
  TaxIntelligenceRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: TaxAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCountry(input?: TaxAnalysisInput): string {
  return (input?.country?.trim() || "SG").toUpperCase();
}

export function defaultCategory(input?: TaxAnalysisInput): TaxCategory {
  return input?.taxCategory ?? "country_specific";
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "informational";
}

/**
 * Never provide unvalidated tax calculations as authoritative legal advice.
 * "aligned" only when validated structural evidence exists.
 */
export function resolveComplianceStatus(
  riskScore: number,
  optimizationOpportunity: boolean,
  validated: boolean,
  config: GlobalTaxIntelligenceConfiguration,
): ComplianceStatus {
  if (!validated) return "unknown";
  if (riskScore >= config.riskThreshold + 20) return "gap";
  if (riskScore < config.riskThreshold && !optimizationOpportunity) return "aligned";
  if (riskScore < config.riskThreshold + 10) return "partial";
  return "under_review";
}

export function computeStructuralTaxSignals(
  input: TaxAnalysisInput,
  config: GlobalTaxIntelligenceConfiguration,
): {
  companyReference: string;
  country: string;
  taxCategory: TaxCategory;
  estimatedTaxObligation: number;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  riskScore: number;
  optimizationOpportunity: boolean;
  calculationTraceId: string;
} {
  const companyReference = defaultCompany(input);
  const country = defaultCountry(input);
  const taxCategory = defaultCategory(input);
  const validated = input.validated === true;
  const seed = `${companyReference}::${country}::${taxCategory}`;

  const riskScore = Math.round(input.riskHint ?? hashScore(`${seed}:risk`, 20, 90));
  const estimatedTaxObligation = Math.round(
    input.obligationHint ?? hashScore(`${seed}:obl`, 100, 5000),
  );
  const optimizationOpportunity =
    input.optimizationHint === true ||
    (validated && riskScore >= config.riskThreshold && riskScore < config.riskThreshold + 25);

  const complianceStatus = resolveComplianceStatus(
    riskScore,
    optimizationOpportunity,
    validated,
    config,
  );
  const riskLevel = riskLevelFromScore(riskScore);
  const calculationTraceId = `gti-trace-${hashScore(seed, 100000, 999999)}`;

  const recommendationSummary = !validated
    ? `Unvalidated structural tax signal for ${country}/${taxCategory} — not legal advice`
    : optimizationOpportunity
      ? `Review ${taxCategory} optimization signal in ${country} (risk=${riskLevel}) — not legal advice`
      : `Monitor ${taxCategory} posture in ${country} (status=${complianceStatus}) — not legal advice`;

  return {
    companyReference,
    country,
    taxCategory,
    estimatedTaxObligation,
    complianceStatus,
    riskLevel,
    recommendationSummary,
    riskScore: Math.max(0, Math.min(100, riskScore)),
    optimizationOpportunity,
    calculationTraceId,
  };
}

export function buildTaxIntelligenceRecord(
  signals: ReturnType<typeof computeStructuralTaxSignals>,
  validationStatus: TaxIntelligenceRecord["validationStatus"] = "passed",
): TaxIntelligenceRecord {
  return {
    taxIntelligenceId: `gti-${Date.now()}-${signals.country}-${signals.taxCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    country: signals.country,
    taxCategory: signals.taxCategory,
    estimatedTaxObligation: signals.estimatedTaxObligation,
    obligationUnit: "structural_units",
    complianceStatus: signals.complianceStatus,
    riskLevel: signals.riskLevel,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: GTI_METADATA_VERSION,
    riskScore: signals.riskScore,
    optimizationOpportunity: signals.optimizationOpportunity,
    calculationTraceId: signals.calculationTraceId,
    structuralSignalOnly: true,
    neverProvideUnvalidatedTaxAsLegalAdvice: true,
    authoritativeLegalAdviceClaim: "none",
  };
}
