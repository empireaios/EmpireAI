/** T2-09 — Consistency recommendation generation. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

export class ConsistencyRecommendationGenerator {
  filter(opportunities: ImprovementOpportunity[]): ImprovementOpportunity[] {
    return opportunities.filter((o) => o.source === "T2-07");
  }
}
