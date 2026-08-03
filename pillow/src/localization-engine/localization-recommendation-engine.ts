/** X4-03 — Localization Recommendation Engine. */

import type { LocalizationEngineConfiguration } from "./configuration.js";
import type { LocalizationRecommendation, LocalizationRecord } from "./types.js";

export class LocalizationRecommendationEngine {
  generate(
    records: LocalizationRecord[],
    config: LocalizationEngineConfiguration,
  ): LocalizationRecommendation[] {
    return records
      .filter(
        (r) =>
          r.validationStatus === "passed" &&
          r.neverOverwriteCanonicalSourceContent === true &&
          (r.gapScore >= 30 || r.readinessScore < config.readinessThreshold + 15),
      )
      .map((r) => ({
        recommendationId: `loc-rec-${Date.now()}-${r.targetCountry}-${r.localizationCategory}`,
        timestamp: new Date().toISOString(),
        companyReference: r.companyReference,
        targetCountry: r.targetCountry,
        localizationCategory: r.localizationCategory,
        readinessScore: r.readinessScore,
        recommendationSummary: `Prioritize ${r.localizationCategory} localization for ${r.targetCountry} (readiness=${r.readinessScore}, gap=${r.gapScore}) without overwriting canonical source`,
        structuralSignalOnly: true as const,
        neverOverwriteCanonicalSourceContent: true as const,
      }));
  }
}
