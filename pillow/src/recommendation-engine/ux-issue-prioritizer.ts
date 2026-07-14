/** T2-09 — UX issue prioritization. */

import type { ImprovementOpportunity } from "./improvement-opportunity-detector.js";
import type { RecommendationPriority } from "./types.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";
import { appendRecommendationLog } from "./recommendation-logging.js";

export class UxIssuePrioritizer {
  prioritize(
    opportunities: ImprovementOpportunity[],
    config: RecommendationEngineConfiguration,
  ): ImprovementOpportunity[] {
    if (!config.priorityRulesEnabled) return opportunities;

    const scored = opportunities.map((opp) => ({
      opp,
      score: this.computePriorityScore(opp, config),
    }));

    scored.sort((a, b) => b.score - a.score);

    appendRecommendationLog({
      event: "issue_prioritization",
      level: "info",
      details: `Prioritized ${scored.length} opportunities`,
    });

    return scored.map((s) => s.opp);
  }

  toPriority(opp: ImprovementOpportunity, config: RecommendationEngineConfiguration): RecommendationPriority {
    const score = this.computePriorityScore(opp, config);
    if (score >= 80 || opp.severity === "error") return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  private computePriorityScore(
    opp: ImprovementOpportunity,
    config: RecommendationEngineConfiguration,
  ): number {
    let score = opp.scoreImpact;
    if (opp.severity === "error") score += 30;
    else if (opp.severity === "warning") score += 15;
    if (opp.source === "T2-06") score += 20;
    if (opp.source === "T2-05") score += 10;
    score += Math.round(opp.confidence * 20);
    return score;
  }
}
