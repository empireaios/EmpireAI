/** X2-08 — Portfolio balancing recommendation engine. */

import { appendPbeLog } from "./pbe-logging.js";
import type { BalanceRecommendation, PortfolioBalanceRecord } from "./types.js";

export class BalanceRecommendationEngine {
  generate(records: PortfolioBalanceRecord[]): BalanceRecommendation[] {
    const recommendations: BalanceRecommendation[] = [];
    const now = new Date().toISOString();
    const latest = records[records.length - 1] ?? null;

    if (latest) {
      for (const action of latest.recommendedBalancingActions.slice(0, 6)) {
        recommendations.push({
          recommendationId: `pbe-rec-${Date.now()}-${action.actionId.slice(-6)}`,
          timestamp: now,
          portfolioBalanceId: latest.portfolioBalanceId,
          source: "portfolio-balance",
          recommendationType: action.actionType,
          rationale: action.rationale,
          priority: action.priority,
          requiresManualApproval: true,
          autoApplied: false,
          structuralSignalOnly: true,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `pbe-rec-${Date.now()}-maintain`,
        timestamp: now,
        portfolioBalanceId: null,
        source: "portfolio-balance",
        recommendationType: "maintain",
        rationale: "Continue scheduled diversification monitoring — no auto-rebalance",
        priority: "low",
        requiresManualApproval: true,
        autoApplied: false,
        structuralSignalOnly: true,
      });
    }

    appendPbeLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} balancing recommendation(s) · autoApplied=false`,
    });

    return recommendations;
  }
}
