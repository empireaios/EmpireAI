/** T2-08 — Scoring rule registry. */

import { SCORING_CATEGORIES } from "./paths.js";
import type { ScoringCategory } from "./types.js";

export type ScoringRule = {
  ruleId: string;
  category: ScoringCategory;
  description: string;
  sourceEngine: string;
};

export class ScoringRuleRegistry {
  private readonly rules: ScoringRule[] = SCORING_CATEGORIES.map((category) => ({
    ruleId: `uxs-rule-${category}`,
    category,
    description: `Score ${category.replace(/_/g, " ")} from upstream UX intelligence`,
    sourceEngine: this.resolveSourceEngine(category),
  }));

  getRules(): ScoringRule[] {
    return [...this.rules];
  }

  getRulesForCategory(category: ScoringCategory): ScoringRule[] {
    return this.rules.filter((r) => r.category === category);
  }

  private resolveSourceEngine(category: ScoringCategory): string {
    switch (category) {
      case "governance_compliance":
        return "T2-01";
      case "design_system_alignment":
        return "T2-02";
      case "executive_preference_alignment":
        return "T2-03";
      case "layout_quality":
      case "visual_hierarchy":
      case "responsiveness":
        return "T2-04";
      case "workflow_usability":
        return "T2-05";
      case "accessibility_quality":
      case "error_state_quality":
      case "loading_state_quality":
      case "empty_state_quality":
        return "T2-06";
      case "visual_consistency":
      case "component_quality":
      case "clarity":
        return "T2-07";
      default:
        return "T2-aggregated";
    }
  }
}
