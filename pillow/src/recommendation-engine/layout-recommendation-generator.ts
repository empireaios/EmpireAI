/** T2-09 — Layout recommendation generation. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";

const LAYOUT_CATEGORIES = new Set([
  "layout_hierarchy",
  "visual_hierarchy",
  "alignment",
  "spacing",
  "responsive_layout",
  "visual_balance",
  "component_organization",
]);

export class LayoutRecommendationGenerator {
  filter(opportunities: ImprovementOpportunity[]): ImprovementOpportunity[] {
    return opportunities.filter(
      (o) =>
        LAYOUT_CATEGORIES.has(o.category) ||
        o.source === "T2-04" ||
        o.category.includes("layout"),
    );
  }
}
