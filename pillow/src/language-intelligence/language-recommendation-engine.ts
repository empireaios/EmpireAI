/** X4-04 — Language Recommendation Engine. */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import type { LanguageIntelligenceRecord, LanguageRecommendation } from "./types.js";

export class LanguageRecommendationEngine {
  generate(
    records: LanguageIntelligenceRecord[],
    config: LanguageIntelligenceConfiguration,
  ): LanguageRecommendation[] {
    return records
      .filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverOverwriteCanonicalSourceContentAutomatically === true &&
          (r.supportedLanguageStatus === "unsupported" ||
            r.translationQualityScore < config.qualityThreshold + 15 ||
            r.terminologyConsistencyScore < 70),
      )
      .map((r) => ({
        recommendationId: `li-rec-${Date.now()}-${r.language}-${r.translationCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        language: r.language,
        translationCategory: r.translationCategory,
        translationQualityScore: r.translationQualityScore,
        recommendationSummary:
          r.supportedLanguageStatus === "unsupported"
            ? `Add ${r.language} to supported languages for ${r.translationCategory} without overwriting canonical source`
            : `Improve ${r.language} ${r.translationCategory} quality/terminology (quality=${r.translationQualityScore})`,
        structuralSignalOnly: true as const,
        neverOverwriteCanonicalSourceContentAutomatically: true as const,
      }));
  }
}
