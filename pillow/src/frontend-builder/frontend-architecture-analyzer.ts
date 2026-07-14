/** T3-01 — Maps recommendations to EmpireAI frontend architecture targets. */

import type { RecommendationCategory } from "../recommendation-engine/types.js";
import type { ApprovedRecommendation } from "./ux-recommendation-interpreter.js";
import type { CodeGenerationScope } from "./types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";

const CATEGORY_SCOPE_MAP: Partial<Record<RecommendationCategory, CodeGenerationScope>> = {
  layout_improvement: "existing_layout",
  component_improvement: "existing_component",
  navigation_improvement: "navigation_area",
  workflow_improvement: "ui_section",
  accessibility_improvement: "existing_component",
  visual_consistency_improvement: "existing_component",
  design_system_alignment: "existing_component",
  executive_preference_alignment: "ui_section",
  form_usability_improvement: "form",
  dashboard_improvement: "dashboard",
  table_improvement: "table",
  card_improvement: "card",
  modal_improvement: "modal",
  drawer_improvement: "drawer",
  loading_state_improvement: "loading_state",
  empty_state_improvement: "empty_state",
  error_state_improvement: "error_state",
};

const SCOPE_FILE_PATTERNS: Record<CodeGenerationScope, string[]> = {
  page: ["empireai-web/app/(cockpit)/cockpit"],
  screen: ["empireai-web/components/cockpit"],
  view: ["empireai-web/components/cockpit"],
  ui_section: ["empireai-web/components/cockpit/development"],
  existing_component: ["empireai-web/components"],
  existing_layout: ["empireai-web/components/cockpit/development"],
  navigation_area: ["empireai-web/lib/cockpit-ux/navigation.ts"],
  form: ["empireai-web/components"],
  card: ["empireai-web/components"],
  table: ["empireai-web/components"],
  dashboard: ["empireai-web/components/cockpit"],
  modal: ["empireai-web/components"],
  drawer: ["empireai-web/components"],
  loading_state: ["empireai-web/components"],
  empty_state: ["empireai-web/components"],
  error_state: ["empireai-web/components"],
};

export class FrontendArchitectureAnalyzer {
  resolveScope(recommendation: ApprovedRecommendation): CodeGenerationScope {
    return (
      CATEGORY_SCOPE_MAP[recommendation.recommendationCategory] ?? "existing_component"
    );
  }

  resolveTargetFiles(
    recommendation: ApprovedRecommendation,
    scope: CodeGenerationScope,
    config: FrontendBuilderConfiguration,
  ): string[] {
    const patterns = SCOPE_FILE_PATTERNS[scope] ?? ["empireai-web/components"];
    const routeHint = recommendation.routeOrViewId?.replace(/^\//, "") ?? null;

    const targets: string[] = [];
    for (const pattern of patterns) {
      if (pattern.endsWith(".ts") || pattern.endsWith(".tsx")) {
        targets.push(pattern);
      } else if (routeHint && scope === "page") {
        targets.push(`${pattern}/${routeHint}/page.tsx`);
      } else if (recommendation.affectedComponents[0]) {
        targets.push(
          `${pattern}/${recommendation.affectedComponents[0].replace(/[^a-zA-Z0-9/_-]/g, "")}.tsx`,
        );
      } else {
        targets.push(`${pattern}/DevelopmentPillowExperience.tsx`);
      }
    }

    return targets.filter((file) =>
      config.allowedTargetDirectories.some((dir) => file.startsWith(dir)),
    );
  }
}
