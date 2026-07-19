/** R4-17 — Journey Recommendation Engine. */

import type { JourneyRecord } from "./types.js";

export class JourneyRecommendationEngine {
  summarizeImprovements(records: JourneyRecord[]): string[] {
    const recommendations: string[] = [];
    const frictionCount = records.reduce((n, r) => n + r.frictionIndicators.length, 0);
    const dropOffCount = records.filter((r) => r.conversionStatus === "dropped_off").length;

    if (frictionCount > 0) {
      recommendations.push("Reduce friction at high-touch support stages");
    }
    if (dropOffCount > 0) {
      recommendations.push("Introduce re-engagement campaigns for stalled journeys");
    }
    if (records.some((r) => r.journeyStage === "consideration" && r.conversionStatus !== "converted")) {
      recommendations.push("Optimize consideration-to-purchase conversion path");
    }
    if (recommendations.length === 0) {
      recommendations.push("Maintain current journey flow — performance is stable");
    }
    return recommendations;
  }

  toMachineReadable(record: JourneyRecord): Record<string, unknown> {
    return { ...record };
  }
}
