/** T2-09 — Accessibility recommendation generation. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

export class AccessibilityRecommendationGenerator {
  filter(opportunities: ImprovementOpportunity[]): ImprovementOpportunity[] {
    return opportunities.filter((o) => o.source === "T2-06");
  }
}
