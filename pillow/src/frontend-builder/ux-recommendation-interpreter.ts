/** T3-01 — Interprets approved UX recommendations for frontend building. */

import type { RedesignProposal } from "../recommendation-engine/types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";
import { appendBuildLog } from "./build-logging.js";

export type ApprovedRecommendation = RedesignProposal & {
  approved: boolean;
};

export class UxRecommendationInterpreter {
  interpret(
    proposals: RedesignProposal[],
    config: FrontendBuilderConfiguration,
  ): ApprovedRecommendation[] {
    appendBuildLog({
      event: "recommendation_interpretation",
      level: "info",
      details: `Interpreting ${proposals.length} redesign proposals`,
    });

    return proposals
      .filter((p) => {
        const confidence = p.confidenceScore / 100;
        if (confidence < config.minConfidenceThreshold) return false;
        if (config.requireApprovalThreshold) {
          return p.priority === "critical" || p.priority === "high" || p.priority === "medium";
        }
        return true;
      })
      .map((p) => ({ ...p, approved: true }));
  }
}
