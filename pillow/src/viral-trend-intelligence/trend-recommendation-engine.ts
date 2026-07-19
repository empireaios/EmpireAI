/** R5-16 — Trend Recommendation Engine. */

import type { TrendRecord } from "./types.js";

export class TrendRecommendationEngine {
  recommend(record: TrendRecord): string {
    if (record.accelerationDetected) {
      return `Act early on accelerating ${record.trendCategory} trend (${record.keywordReference ?? record.hashtagReference ?? "signal"}) — score ${record.trendScore}.`;
    }
    if (record.declineDetected) {
      return `Reduce exposure to declining ${record.trendCategory} trend — growth ${record.growthRate}%.`;
    }
    if (record.predictedScore >= 75) {
      return `Prepare creative/content for rising ${record.trendCategory} signal from ${record.trendSource}.`;
    }
    if (record.hashtagReference) {
      return `Monitor hashtag ${record.hashtagReference} for early amplification windows.`;
    }
    return `Continue authorized public monitoring of ${record.trendCategory} trend.`;
  }

  recommendForSet(records: TrendRecord[]): TrendRecord[] {
    return records.map((record) => ({
      ...record,
      recommendationSummary: this.recommend(record),
      timestamp: new Date().toISOString(),
    }));
  }
}
