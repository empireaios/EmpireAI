/** R5-14 — Conversion Recommendation Engine. */

import type { ConversionRecord } from "./types.js";

export class RecommendationEngine {
  recommend(record: ConversionRecord): string {
    if (record.abandonmentDetected) {
      return `Reduce abandonment at ${record.funnelStage} on ${record.marketingChannel} — drop-off ${record.dropOffRate}%.`;
    }
    if (record.bottleneckDetected) {
      return `Relieve bottleneck at ${record.funnelStage} — simplify CTA and shorten path to conversion.`;
    }
    if (record.landingPageScore < 50) {
      return `Improve landing page relevance for ${record.marketingChannel} — score ${record.landingPageScore}.`;
    }
    if (record.conversionRate < 5) {
      return `Raise offer clarity at ${record.funnelStage} — conversion rate ${record.conversionRate}% is below target.`;
    }
    if (record.conversionEfficiencyScore >= 70) {
      return `Scale winning funnel path at ${record.funnelStage} — efficiency ${record.conversionEfficiencyScore}.`;
    }
    return `Maintain funnel pacing for ${record.marketingChannel} at ${record.funnelStage}.`;
  }

  recommendForSet(records: ConversionRecord[]): ConversionRecord[] {
    return records.map((record) => ({
      ...record,
      recommendedOptimization: this.recommend(record),
      timestamp: new Date().toISOString(),
    }));
  }
}
