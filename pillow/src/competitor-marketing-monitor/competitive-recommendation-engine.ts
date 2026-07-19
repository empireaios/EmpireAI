/** R5-15 — Competitive Recommendation Engine. */

import type { CompetitorRecord } from "./types.js";

export class CompetitiveRecommendationEngine {
  recommend(record: CompetitorRecord): string {
    if (record.emergingCompetitor) {
      return `Track emerging competitor ${record.competitorIdentifier} on ${record.marketingChannel} — score ${record.competitiveScore}.`;
    }
    if (record.strategyChangeDetected) {
      return `Respond to strategy shift by ${record.competitorIdentifier} — refresh messaging and offer positioning.`;
    }
    if (record.competitiveScore >= 75) {
      return `Defend share vs ${record.competitorIdentifier} — reinforce differentiators on ${record.marketingChannel}.`;
    }
    if (record.keywordReference) {
      return `Watch keyword ${record.keywordReference} against ${record.competitorIdentifier} for SEO/ad overlap.`;
    }
    return `Continue authorized public monitoring of ${record.competitorIdentifier}.`;
  }

  recommendForSet(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      recommendationSummary: this.recommend(record),
      timestamp: new Date().toISOString(),
    }));
  }
}
