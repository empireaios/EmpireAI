/** X4-07 — Tax Recommendation Engine. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type { TaxIntelligenceRecord, TaxRecommendation } from "./types.js";

export class TaxRecommendationEngine {
  generate(
    records: TaxIntelligenceRecord[],
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverProvideUnvalidatedTaxAsLegalAdvice === true &&
          r.authoritativeLegalAdviceClaim === "none" &&
          (r.optimizationOpportunity ||
            r.complianceStatus === "gap" ||
            r.complianceStatus === "partial" ||
            r.complianceStatus === "under_review" ||
            r.riskScore >= config.riskThreshold),
      )
      .map((r) => ({
        recommendationId: `gti-rec-${Date.now()}-${r.country}-${r.taxCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        country: r.country,
        taxCategory: r.taxCategory,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.taxCategory} in ${r.country} (status=${r.complianceStatus}, risk=${r.riskLevel}) — not authoritative legal advice`,
        structuralSignalOnly: true as const,
        neverProvideUnvalidatedTaxAsLegalAdvice: true as const,
        authoritativeLegalAdviceClaim: "none" as const,
      }));
  }
}
