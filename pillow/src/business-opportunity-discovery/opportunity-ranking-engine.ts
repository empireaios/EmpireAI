/** X1-02 — Opportunity Ranking Engine. */

import type { OpportunityRecord } from "./types.js";

export class OpportunityRankingEngine {
  rank(records: OpportunityRecord[]): OpportunityRecord[] {
    const sorted = [...records].sort((a, b) => {
      if (b.opportunityScore !== a.opportunityScore) {
        return b.opportunityScore - a.opportunityScore;
      }
      return b.confidenceScore - a.confidenceScore;
    });

    return sorted.map((record, index) => ({
      ...record,
      ranking: index + 1,
      structuralSignalOnly: true as const,
      fabricatedMarketInformation: false as const,
      timestamp: new Date().toISOString(),
    }));
  }
}
