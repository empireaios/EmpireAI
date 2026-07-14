/** T4-06 — Executive preference alignment rationale generator. */

import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";

export class ExecutivePreferenceRationaleGenerator {
  generate(input: {
    proposals: RedesignProposalRecord[];
    config: ExplainDecisionsConfiguration;
    recommendationEngine: RecommendationEngine | null;
  }): string | null {
    if (!input.config.executivePreferenceExplanationRulesEnabled) return null;

    const parts: string[] = [];
    let alignedCount = 0;

    if (input.recommendationEngine) {
      try {
        const record = input.recommendationEngine.getLatestRecord?.() ?? null;
        alignedCount =
          record?.proposals.filter((r) => r.executivePreferenceAlignment).length ?? 0;
        if (alignedCount > 0) {
          parts.push(
            `${alignedCount} recommendation(s) align with learned executive style preferences`,
          );
        }
      } catch {
        /* optional upstream */
      }
    }

    const highConfidence = input.proposals.filter((p) => p.confidenceScore >= 0.7).length;
    if (highConfidence > 0) {
      parts.push(
        `${highConfidence} proposal(s) carry high confidence for executive review`,
      );
    }

    return parts.length > 0 ? parts.join("; ") : null;
  }
}
