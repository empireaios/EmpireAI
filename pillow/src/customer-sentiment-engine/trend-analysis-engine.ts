/** R4-10 — Trend analysis engine. */

import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { SentimentRecord, SentimentTrend } from "./types.js";
import { SentimentMetadataGenerator } from "./sentiment-metadata-generator.js";

export class TrendAnalysisEngine {
  private readonly metadataGenerator = new SentimentMetadataGenerator();

  trackTrends(
    records: SentimentRecord[],
    config: CustomerSentimentEngineConfiguration,
    input: { customerId: string; conversationReference?: string },
  ): SentimentTrend | null {
    const rule = config.trendRules.find((r) => r.enabled);
    if (!config.trendRulesEnabled || !rule) return null;

    const filtered = records
      .filter((r) => r.customerId === input.customerId)
      .filter((r) =>
        input.conversationReference
          ? r.conversationReference === input.conversationReference
          : true,
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (filtered.length < rule.minRecords) return null;

    const averageScore = Math.round(
      filtered.reduce((sum, r) => sum + r.sentimentScore, 0) / filtered.length,
    );

    const midpoint = Math.floor(filtered.length / 2);
    const firstHalf = filtered.slice(0, midpoint);
    const secondHalf = filtered.slice(midpoint);
    const firstAvg =
      firstHalf.reduce((sum, r) => sum + r.sentimentScore, 0) / Math.max(1, firstHalf.length);
    const secondAvg =
      secondHalf.reduce((sum, r) => sum + r.sentimentScore, 0) / Math.max(1, secondHalf.length);
    const delta = secondAvg - firstAvg;

    let trendDirection: SentimentTrend["trendDirection"] = "stable";
    if (delta >= rule.improvingDelta) trendDirection = "improving";
    if (delta <= rule.decliningDelta) trendDirection = "declining";

    return this.metadataGenerator.buildTrend({
      customerId: input.customerId,
      conversationReference:
        input.conversationReference ?? filtered[0]?.conversationReference ?? "unknown",
      averageScore,
      trendDirection,
      recordCount: filtered.length,
    });
  }
}
