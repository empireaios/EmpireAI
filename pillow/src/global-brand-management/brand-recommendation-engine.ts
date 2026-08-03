/** X4-11 — Brand Recommendation Engine. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import type { BrandGovernanceRecord, BrandRecommendation } from "./types.js";

export class BrandRecommendationEngine {
  generate(
    records: BrandGovernanceRecord[],
    config: GlobalBrandManagementConfiguration,
  ): BrandRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverModifyProtectedBrandAssetsWithoutAuthorization === true &&
          r.protectedAssetModificationClaim === "none" &&
          (r.inconsistencyDetected ||
            r.reputationRiskDetected ||
            r.complianceStatus === "gap" ||
            r.complianceStatus === "partial" ||
            r.complianceStatus === "under_review" ||
            r.reputationScore < config.reputationThreshold),
      )
      .map((r) => ({
        recommendationId: `gbm-rec-${Date.now()}-${r.brandReference}-${r.region}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        brandReference: r.brandReference,
        region: r.region,
        brandCategory: r.brandCategory,
        riskLevel: r.riskLevel,
        recommendationSummary: `Address ${r.brandCategory} for ${r.brandReference} in ${r.region} (consistency=${r.brandConsistencyScore}, reputation=${r.reputationScore}) — no unprotected asset modification`,
        structuralSignalOnly: true as const,
        neverModifyProtectedBrandAssetsWithoutAuthorization: true as const,
        protectedAssetModificationClaim: "none" as const,
      }));
  }
}
