/** R4-13 — Return Decision Engine. */

import type { RecommendedAction } from "./types.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";

export class ReturnDecisionEngine {
  recommendAction(input: {
    returnRiskScore: number;
    config: ReturnsIntelligenceEngineConfiguration;
  }): RecommendedAction {
    if (!input.config.recommendationRulesEnabled) return "manual_review";

    const high = input.config.highRiskThreshold;
    const medium = input.config.mediumRiskThreshold;

    if (input.returnRiskScore >= high) return "escalate";
    if (input.returnRiskScore >= medium) return "manual_review";
    if (input.returnRiskScore >= medium - 15) return "request_evidence";
    if (input.returnRiskScore < 25) return "approve";
    return "manual_review";
  }
}
