/** T2-09 — Component recommendation generation. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

export class ComponentRecommendationGenerator {
  filter(opportunities: ImprovementOpportunity[]): ImprovementOpportunity[] {
    return opportunities.filter(
      (o) =>
        o.affectedComponentId !== null ||
        o.category.includes("component") ||
        o.category === "clarity",
    );
  }
}
