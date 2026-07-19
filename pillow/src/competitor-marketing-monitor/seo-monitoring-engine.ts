/** R5-15 — SEO Monitoring Engine. */

import type { CompetitorRecord } from "./types.js";

export class SeoMonitoringEngine {
  monitorKeywords(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      keywordReference: record.keywordReference ?? `kw-${record.competitorIdentifier}`,
      timestamp: new Date().toISOString(),
    }));
  }

  monitorSeoRankings(records: CompetitorRecord[], seoHealthHint = 50): CompetitorRecord[] {
    return records.map((record) => {
      const rankingBoost = Math.max(0, Math.min(20, (seoHealthHint - 50) / 5));
      return {
        ...record,
        keywordReference: record.keywordReference ?? `kw-${record.competitorIdentifier}`,
        competitiveScore: Math.min(100, Math.round((record.competitiveScore + rankingBoost) * 100) / 100),
        marketingChannel: record.marketingChannel === "seo" ? record.marketingChannel : record.marketingChannel,
        timestamp: new Date().toISOString(),
      };
    });
  }
}
