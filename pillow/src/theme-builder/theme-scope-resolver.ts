/** T3-04 — Resolves theme scope from requirements. */

import type { RecommendationCategory } from "../recommendation-engine/types.js";
import type { ThemeRequirement } from "./theme-requirement-interpreter.js";
import type { ThemeScope } from "./types.js";

const SCOPE_MAP: Partial<Record<RecommendationCategory, ThemeScope>> = {
  design_system_alignment: "global",
  visual_consistency_improvement: "global",
  executive_preference_alignment: "global",
  dashboard_improvement: "dashboard",
  component_improvement: "component",
  layout_improvement: "page",
  card_improvement: "card",
  form_usability_improvement: "form",
  table_improvement: "table",
  modal_improvement: "modal",
  drawer_improvement: "drawer",
  loading_state_improvement: "loading_state",
  empty_state_improvement: "empty_state",
  error_state_improvement: "error_state",
};

export class ThemeScopeResolver {
  resolve(requirement: ThemeRequirement): ThemeScope {
    if (requirement.recommendation) {
      return SCOPE_MAP[requirement.recommendation.recommendationCategory] ?? "global";
    }
    if (requirement.relatedLayout) return "page";
    if (requirement.relatedComponents.length > 0) {
      const cat = requirement.relatedComponents[0]!.componentCategory;
      const map: Record<string, ThemeScope> = {
        button: "button",
        form: "form",
        table: "table",
        card: "card",
        modal: "modal",
        drawer: "drawer",
        navigation_item: "navigation",
        loading_state: "loading_state",
        empty_state: "empty_state",
        error_state: "error_state",
      };
      return map[cat] ?? "component";
    }
    return "global";
  }
}
