/** X4-02 — Country Ranking Engine. */

import type { CountryIntelligenceRecord, ExpansionPriority } from "./types.js";
import { buildCountryRecord, compositeScore } from "./structural-signals.js";

const PRIORITY_RANK: Record<ExpansionPriority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  deferred: 1,
};

export class CountryRankingEngine {
  rank(records: CountryIntelligenceRecord[]): CountryIntelligenceRecord[] {
    const sorted = [...records].sort((a, b) => {
      const priorityDelta =
        PRIORITY_RANK[b.expansionPriority] - PRIORITY_RANK[a.expansionPriority];
      if (priorityDelta !== 0) return priorityDelta;
      return compositeScore(b) - compositeScore(a);
    });

    return sorted.map((record, index) =>
      buildCountryRecord(
        {
          country: record.country,
          marketSizeScore: record.marketSizeScore,
          economicScore: record.economicScore,
          commerceReadinessScore: record.commerceReadinessScore,
          operationalFeasibilityScore: record.operationalFeasibilityScore,
          expansionPriority: record.expansionPriority,
        },
        `Ranked #${index + 1} · priority=${record.expansionPriority} · composite=${compositeScore(record)}`,
        record.validationStatus,
      ),
    );
  }
}
