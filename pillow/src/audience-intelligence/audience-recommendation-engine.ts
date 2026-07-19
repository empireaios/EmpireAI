/** R5-08 — Audience Recommendation Engine. */

import { appendAudLog } from "./aud-logging.js";
import type { AudienceRecommendation, AudienceRecord } from "./types.js";

export class AudienceRecommendationEngine {
  private recommendations: AudienceRecommendation[] = [];

  generate(records: AudienceRecord[]): AudienceRecommendation[] {
    const generated: AudienceRecommendation[] = [];
    for (const record of records) {
      const items: string[] = [];
      if (record.audienceQualityScore < 60) {
        items.push("Refine targeting filters to improve audience quality");
      }
      if (record.engagementScore < 50) {
        items.push("Increase engagement via lookalike expansion on high-intent cohorts");
      }
      if (record.overlapAudienceIds.length > 0) {
        items.push("Deduplicate overlapping audiences before campaign activation");
      }
      if (record.intentScore >= 70) {
        items.push("Prioritize conversion campaigns for high-intent audience");
      }
      if (items.length === 0) {
        items.push("Maintain current audience definition and monitor quality trend");
      }

      for (const summary of items) {
        const rec: AudienceRecommendation = {
          recommendationId: `aud-recmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          audienceRecordId: record.audienceRecordId,
          summary,
          priority:
            record.audienceQualityScore < 50 || record.overlapAudienceIds.length > 2
              ? "high"
              : record.engagementScore < 60
                ? "medium"
                : "low",
          timestamp: new Date().toISOString(),
        };
        generated.push(rec);
        this.recommendations.push(rec);
      }
    }

    appendAudLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${generated.length} audience recommendation(s)`,
    });
    return generated.map((r) => ({ ...r }));
  }

  list(): AudienceRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  resetForTesting(): void {
    this.recommendations = [];
  }
}
