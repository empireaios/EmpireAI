/** T3-03 — Plans target layout structure from requirements and analysis. */

import type { RecommendationCategory } from "../recommendation-engine/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { LayoutScope } from "./types.js";
import type { CurrentLayoutAnalysis } from "./current-layout-analyzer.js";
import type { LayoutRequirement } from "./layout-requirement-interpreter.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

const SCOPE_MAP: Partial<Record<RecommendationCategory, LayoutScope>> = {
  layout_improvement: "main_content",
  navigation_improvement: "navigation_area",
  dashboard_improvement: "dashboard",
  form_usability_improvement: "form",
  table_improvement: "table",
  card_improvement: "card",
  modal_improvement: "modal",
  drawer_improvement: "drawer",
  loading_state_improvement: "loading_state",
  empty_state_improvement: "empty_state",
  error_state_improvement: "error_state",
  workflow_improvement: "main_content",
  design_system_alignment: "panel",
  visual_consistency_improvement: "panel",
};

export type TargetLayoutPlan = {
  scope: LayoutScope;
  targetFiles: string[];
  structure: string[];
  hierarchyImprovements: string[];
  groupingImprovements: string[];
  spacingImprovements: string[];
  alignmentImprovements: string[];
};

export class TargetLayoutPlanner {
  plan(
    requirement: LayoutRequirement,
    analysis: CurrentLayoutAnalysis,
    config: LayoutRefactoringConfiguration,
  ): TargetLayoutPlan {
    appendRefactoringLog({
      event: "target_layout_planning",
      level: "info",
      details: `Planning layout for ${analysis.screenId}`,
    });

    const scope =
      SCOPE_MAP[requirement.recommendation.recommendationCategory] ?? "main_content";
    const targetFiles = this.resolveTargetFiles(scope, analysis, config);

    return {
      scope,
      targetFiles,
      structure: [
        `header-region`,
        `main-content-region`,
        `${scope}-region`,
        `footer-region`,
      ],
      hierarchyImprovements: [
        "Elevate primary actions in visual hierarchy",
        "Group related controls into logical sections",
        ...analysis.hierarchySummary.slice(0, 2).map((h) => `Preserve ${h}`),
      ],
      groupingImprovements: [
        "Cluster filter and search controls",
        "Separate data display from action toolbar",
      ],
      spacingImprovements: [
        "Apply consistent gap-4 between sections",
        "Increase padding in dense regions",
        ...analysis.spacingIssues.slice(0, 2),
      ],
      alignmentImprovements: [
        "Align labels and inputs on baseline grid",
        "Center empty and error states",
        ...analysis.alignmentIssues.slice(0, 2),
      ],
    };
  }

  private resolveTargetFiles(
    scope: LayoutScope,
    analysis: CurrentLayoutAnalysis,
    config: LayoutRefactoringConfiguration,
  ): string[] {
    const baseDir = config.allowedTargetDirectories[0] ?? "empireai-web/components/cockpit";
    const slug = analysis.screenId.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const fileName = `${slug}-${scope}-layout.tsx`;
    const path = `${baseDir}/layouts/${fileName}`;
    if (config.allowedTargetDirectories.some((d) => path.startsWith(d))) {
      return [path];
    }
    return [`empireai-web/components/cockpit/layouts/${fileName}`];
  }
}
