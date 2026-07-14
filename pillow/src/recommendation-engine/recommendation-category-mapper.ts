/** T2-09 — Maps opportunities to recommendation categories. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";
import type { RecommendationCategory } from "./types.js";

export function mapOpportunityToCategory(opp: ImprovementOpportunity): RecommendationCategory {
  const cat = opp.category.toLowerCase();
  const desc = opp.description.toLowerCase();

  if (cat.includes("accessibility") || opp.source === "T2-06") {
    if (cat.includes("loading") || desc.includes("loading")) return "loading_state_improvement";
    if (cat.includes("empty") || desc.includes("empty")) return "empty_state_improvement";
    if (cat.includes("error") || desc.includes("error")) return "error_state_improvement";
    return "accessibility_improvement";
  }
  if (cat.includes("consistency") || cat.includes("typography") || cat.includes("color") || cat.includes("spacing") || cat.includes("sizing") || opp.source === "T2-07") {
    if (cat.includes("component")) return "component_improvement";
    if (cat.includes("modal")) return "modal_improvement";
    if (cat.includes("card")) return "card_improvement";
    if (cat.includes("table")) return "table_improvement";
    if (cat.includes("form")) return "form_usability_improvement";
    return "visual_consistency_improvement";
  }
  if (cat.includes("workflow") || cat.includes("friction") || cat.includes("repeated") || cat.includes("navigation_friction") || opp.source === "T2-05") {
    if (cat.includes("form") || desc.includes("form")) return "form_usability_improvement";
    if (desc.includes("dashboard")) return "dashboard_improvement";
    if (cat.includes("navigation") || desc.includes("navigation")) return "navigation_improvement";
    return "workflow_improvement";
  }
  if (cat.includes("layout") || cat.includes("alignment") || cat.includes("spacing") || cat.includes("visual_hierarchy") || cat.includes("responsive")) {
    return "layout_improvement";
  }
  if (cat.includes("component") || cat.includes("clarity")) return "component_improvement";
  if (cat.includes("navigation")) return "navigation_improvement";
  if (cat.includes("governance") || cat.includes("design_system")) return "design_system_alignment";
  if (cat.includes("executive") || cat.includes("preference")) return "executive_preference_alignment";
  if (cat.includes("modal")) return "modal_improvement";
  if (cat.includes("drawer")) return "drawer_improvement";

  return "layout_improvement";
}

export function buildExpectedBenefit(opp: ImprovementOpportunity, category: RecommendationCategory): string {
  const benefits: Record<string, string> = {
    layout_improvement: "Improved visual hierarchy and information organization",
    component_improvement: "More consistent and usable interface components",
    navigation_improvement: "Clearer navigation paths and reduced user confusion",
    workflow_improvement: "Fewer steps and reduced friction in user workflows",
    accessibility_improvement: "More inclusive experience for all users",
    visual_consistency_improvement: "Unified design language across the interface",
    design_system_alignment: "Better adherence to established design standards",
    executive_preference_alignment: "Interface aligned with executive UX preferences",
    form_usability_improvement: "Easier and more reliable form completion",
    dashboard_improvement: "Clearer data presentation and dashboard usability",
    loading_state_improvement: "Better feedback during loading operations",
    empty_state_improvement: "Clearer guidance when content is unavailable",
    error_state_improvement: "More helpful error recovery for users",
  };
  return benefits[category] ?? `Address: ${opp.description}`;
}
