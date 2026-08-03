/** X4-06 — Compliance Recommendation Engine. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type { ComplianceRecommendation, ComplianceRecord } from "./types.js";

export class ComplianceRecommendationEngine {
  generate(
    records: ComplianceRecord[],
    config: RegionalComplianceEngineConfiguration,
  ): ComplianceRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverFalselyCertifyCompliance === true &&
          r.certificationClaim === "none" &&
          (r.violationDetected ||
            r.complianceStatus === "gap" ||
            r.complianceStatus === "partial" ||
            r.complianceStatus === "under_review" ||
            r.riskScore >= config.riskThreshold),
      )
      .map((r) => ({
        recommendationId: `rce-rec-${Date.now()}-${r.country}-${r.regulationCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        country: r.country,
        regulationCategory: r.regulationCategory,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.regulationCategory} in ${r.country} (status=${r.complianceStatus}, risk=${r.riskLevel}) — no false certification`,
        structuralSignalOnly: true as const,
        neverFalselyCertifyCompliance: true as const,
        certificationClaim: "none" as const,
      }));
  }
}
