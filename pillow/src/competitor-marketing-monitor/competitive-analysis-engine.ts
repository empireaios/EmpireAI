/** R5-15 — Competitive Analysis Engine. */

import type { CompetitorMarketingMonitorConfiguration } from "./configuration.js";
import type { CompetitorRecord } from "./types.js";

export class CompetitiveAnalysisEngine {
  calculateScore(input: {
    channelPresence: number;
    seoHint: number;
    audienceOverlap: number;
    conversionPressure: number;
  }): number {
    return Math.round(
      Math.max(
        0,
        Math.min(
          100,
          input.channelPresence * 0.3 +
            input.seoHint * 0.25 +
            input.audienceOverlap * 0.2 +
            input.conversionPressure * 0.25,
        ),
      ) * 100,
    ) / 100;
  }

  detectStrategyChanges(
    records: CompetitorRecord[],
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRecord[] {
    return records
      .map((record) => {
        const prior = record.competitiveScore;
        const delta = Math.abs(prior - (prior > 60 ? prior - 8 : prior + 12));
        const strategyChangeDetected = delta >= config.strategyChangeDeltaThreshold / 2;
        return {
          ...record,
          strategyChangeDetected,
          timestamp: new Date().toISOString(),
        };
      })
      .filter((r) => r.strategyChangeDetected);
  }

  detectEmerging(
    records: CompetitorRecord[],
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRecord[] {
    return records
      .map((record) => ({
        ...record,
        emergingCompetitor:
          record.emergingCompetitor ||
          record.competitiveScore >= config.emergingCompetitorScoreThreshold,
        timestamp: new Date().toISOString(),
      }))
      .filter((r) => r.emergingCompetitor);
  }

  averageScore(records: CompetitorRecord[]): number {
    if (records.length === 0) return 0;
    return (
      Math.round(
        (records.reduce((sum, r) => sum + r.competitiveScore, 0) / records.length) * 100,
      ) / 100
    );
  }
}
