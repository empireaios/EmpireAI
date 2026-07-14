/** T2-09 — Workflow recommendation generation. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

export class WorkflowRecommendationGenerator {
  filter(opportunities: ImprovementOpportunity[]): ImprovementOpportunity[] {
    return opportunities.filter((o) => o.source === "T2-05" || o.category.includes("friction"));
  }
}
