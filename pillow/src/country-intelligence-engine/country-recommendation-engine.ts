/** X4-02 — Country Recommendation Engine. */

import type { CountryIntelligenceRecord, CountryRecommendation } from "./types.js";
import { compositeScore } from "./structural-signals.js";

export class CountryRecommendationEngine {
  generate(records: CountryIntelligenceRecord[]): CountryRecommendation[] {
    const validated = records.filter(
      (r) => r.validationStatus === "passed" || r.validationStatus === "partial",
    );

    if (validated.length === 0) {
      return [];
    }

    return validated.slice(0, 5).map((record, index) => {
      let summary = record.recommendationSummary;
      if (record.expansionPriority === "critical" || record.expansionPriority === "high") {
        summary = `Prioritize expansion into ${record.country} · ${record.expansionPriority} priority`;
      } else if (record.expansionPriority === "deferred") {
        summary = `Defer expansion into ${record.country} until readiness improves`;
      } else {
        summary = `Consider ${record.country} for staged expansion · ${record.expansionPriority} priority`;
      }

      return {
        recommendationId: `cie-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        country: record.country,
        recommendationSummary: summary,
        expansionPriority: record.expansionPriority,
        compositeScore: compositeScore(record),
        structuralSignalOnly: true,
        neverRecommendUsingUnvalidatedCountryData: true,
      };
    });
  }
}
