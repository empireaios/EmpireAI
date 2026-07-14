/** T3-04 — Interprets theme requirements from upstream intelligence. */

import type { FrontendBuildRecord } from "../frontend-builder/types.js";
import type { ComponentGenerationRecord } from "../component-generator/types.js";
import type { LayoutRefactoringRecord } from "../layout-refactoring/types.js";
import type { RedesignProposal } from "../recommendation-engine/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import { appendThemeLog } from "./theme-logging.js";

export type ThemeRequirement = {
  recommendation: RedesignProposal | null;
  buildRecord: FrontendBuildRecord | null;
  relatedComponents: ComponentGenerationRecord[];
  relatedLayout: LayoutRefactoringRecord | null;
  confidenceScore: number;
  themeName: string;
};

const THEME_CATEGORIES = [
  "design_system_alignment",
  "visual_consistency_improvement",
  "executive_preference_alignment",
  "dashboard_improvement",
  "component_improvement",
  "layout_improvement",
  "card_improvement",
  "form_usability_improvement",
  "table_improvement",
  "modal_improvement",
  "drawer_improvement",
  "loading_state_improvement",
  "empty_state_improvement",
  "error_state_improvement",
] as const;

export class ThemeRequirementInterpreter {
  interpret(
    proposals: RedesignProposal[],
    buildRecords: FrontendBuildRecord[],
    componentRecords: ComponentGenerationRecord[],
    layoutRecords: LayoutRefactoringRecord[],
    config: ThemeBuilderConfiguration,
  ): ThemeRequirement[] {
    appendThemeLog({
      event: "theme_requirement_interpretation",
      level: "info",
      details: `Interpreting ${proposals.length} proposals · ${layoutRecords.length} layouts`,
    });

    const buildByRec = new Map(
      buildRecords.map((r) => [r.sourceRecommendationId, r]),
    );
    const layoutByRec = new Map(
      layoutRecords.map((r) => [r.sourceRecommendationId, r]),
    );

    const fromProposals = proposals
      .filter((p) => {
        const confidence = p.confidenceScore / 100;
        if (confidence < config.minConfidenceThreshold) return false;
        if (config.requireApprovalThreshold) {
          return ["critical", "high", "medium"].includes(p.priority);
        }
        return true;
      })
      .filter((p) =>
        THEME_CATEGORIES.includes(p.recommendationCategory as (typeof THEME_CATEGORIES)[number]),
      )
      .map((p) => ({
        recommendation: p,
        buildRecord: buildByRec.get(p.recommendationId) ?? null,
        relatedComponents: componentRecords.filter(
          (c) => c.sourceRecommendationId === p.recommendationId,
        ),
        relatedLayout: layoutByRec.get(p.recommendationId) ?? null,
        confidenceScore: p.confidenceScore,
        themeName: this.buildThemeName(p.recommendationTitle),
      }));

    if (fromProposals.length > 0) return fromProposals;

    if (layoutRecords.length > 0) {
      const layout = layoutRecords[0]!;
      return [
        {
          recommendation: null,
          buildRecord: null,
          relatedComponents: componentRecords.slice(0, 3),
          relatedLayout: layout,
          confidenceScore: layout.confidenceScore,
          themeName: `LayoutTheme${layout.targetScreenId.replace(/[^a-zA-Z0-9]/g, "")}`,
        },
      ];
    }

    if (componentRecords.length > 0) {
      const component = componentRecords[0]!;
      return [
        {
          recommendation: null,
          buildRecord: null,
          relatedComponents: [component],
          relatedLayout: null,
          confidenceScore: component.confidenceScore,
          themeName: `${component.componentName}Theme`,
        },
      ];
    }

    return [
      {
        recommendation: null,
        buildRecord: null,
        relatedComponents: [],
        relatedLayout: null,
        confidenceScore: 50,
        themeName: "EmpireGlobalTheme",
      },
    ];
  }

  private buildThemeName(title: string): string {
    const words = title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3);
    const base = words.length > 0 ? words.join("") : "Empire";
    return `${base.charAt(0).toUpperCase()}${base.slice(1)}Theme`;
  }
}
