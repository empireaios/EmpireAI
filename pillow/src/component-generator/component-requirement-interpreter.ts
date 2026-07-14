/** T3-02 — Interprets component requirements from recommendations and build plans. */

import type { FrontendBuildRecord } from "../frontend-builder/types.js";
import type { RedesignProposal } from "../recommendation-engine/types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

export type ComponentRequirement = {
  recommendation: RedesignProposal;
  buildRecord: FrontendBuildRecord | null;
  confidenceScore: number;
};

export class ComponentRequirementInterpreter {
  interpret(
    proposals: RedesignProposal[],
    buildRecords: FrontendBuildRecord[],
    config: ComponentGeneratorConfiguration,
  ): ComponentRequirement[] {
    appendGenerationLog({
      event: "requirement_interpretation",
      level: "info",
      details: `Interpreting ${proposals.length} proposals · ${buildRecords.length} build records`,
    });

    const buildByRec = new Map(
      buildRecords.map((r) => [r.sourceRecommendationId, r]),
    );

    return proposals
      .filter((p) => {
        const confidence = p.confidenceScore / 100;
        if (confidence < config.minConfidenceThreshold) return false;
        if (config.requireApprovalThreshold) {
          return ["critical", "high", "medium"].includes(p.priority);
        }
        return true;
      })
      .filter((p) => this.isComponentRelated(p))
      .map((p) => ({
        recommendation: p,
        buildRecord: buildByRec.get(p.recommendationId) ?? null,
        confidenceScore: p.confidenceScore,
      }));
  }

  private isComponentRelated(proposal: RedesignProposal): boolean {
    const componentCategories = [
      "component_improvement",
      "form_usability_improvement",
      "card_improvement",
      "table_improvement",
      "modal_improvement",
      "drawer_improvement",
      "loading_state_improvement",
      "empty_state_improvement",
      "error_state_improvement",
      "dashboard_improvement",
      "design_system_alignment",
      "accessibility_improvement",
      "visual_consistency_improvement",
    ];
    return componentCategories.includes(proposal.recommendationCategory);
  }
}
