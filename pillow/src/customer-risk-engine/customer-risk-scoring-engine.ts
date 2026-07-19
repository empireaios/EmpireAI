/** R4-14 — Customer Risk Scoring Engine. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type { RiskLevel } from "./types.js";

export class CustomerRiskScoringEngine {
  aggregateScores(scores: number[]): number {
    if (scores.length === 0) return 0;
    const max = Math.max(...scores);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(Math.min(100, max * 0.6 + avg * 0.4));
  }

  resolveRiskLevel(score: number, config: CustomerRiskEngineConfiguration): RiskLevel {
    if (!config.riskThresholdRulesEnabled) {
      return score >= 65 ? "high" : score >= 40 ? "medium" : "low";
    }

    if (score >= config.criticalRiskThreshold) return "critical";
    if (score >= config.highRiskThreshold) return "high";
    if (score >= config.mediumRiskThreshold) return "medium";
    return "low";
  }
}
