/** X2-07 — Risk mitigation recommendation engine. */

import { appendPreLog } from "./pre-logging.js";
import type {
  PortfolioRiskRecord,
  PortfolioRiskScoreSummary,
  RiskRecommendation,
} from "./types.js";

export class RiskRecommendationEngine {
  generate(
    records: PortfolioRiskRecord[],
    summary: PortfolioRiskScoreSummary | null,
  ): RiskRecommendation[] {
    const recommendations: RiskRecommendation[] = [];
    const now = new Date().toISOString();

    const critical = records.filter((r) => r.riskSeverity === "critical");
    for (const risk of critical.slice(0, 5)) {
      recommendations.push({
        recommendationId: `pre-rec-${Date.now()}-${risk.riskRecordId.slice(-6)}`,
        timestamp: now,
        riskRecordId: risk.riskRecordId,
        source: risk.riskCategory,
        recommendationType: "mitigate_critical",
        rationale: risk.recommendedMitigation,
        priority: "critical",
        structuralSignalOnly: true,
      });
    }

    const emerging = records.filter((r) => r.emerging && r.riskSeverity !== "critical");
    for (const risk of emerging.slice(0, 5)) {
      recommendations.push({
        recommendationId: `pre-rec-${Date.now()}-em-${risk.riskRecordId.slice(-6)}`,
        timestamp: now,
        riskRecordId: risk.riskRecordId,
        source: risk.riskCategory,
        recommendationType: "monitor_emerging",
        rationale: risk.recommendedMitigation,
        priority: risk.riskSeverity === "high" ? "high" : "medium",
        structuralSignalOnly: true,
      });
    }

    if (summary && summary.overallPortfolioRiskScore >= 55) {
      recommendations.push({
        recommendationId: `pre-rec-${Date.now()}-portfolio`,
        timestamp: now,
        riskRecordId: null,
        source: "portfolio-risk",
        recommendationType: "reduce_portfolio_risk",
        rationale: `Overall portfolio risk score ${summary.overallPortfolioRiskScore} exceeds alert band`,
        priority: summary.overallPortfolioRiskScore >= 80 ? "critical" : "high",
        structuralSignalOnly: true,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `pre-rec-${Date.now()}-maintain`,
        timestamp: now,
        riskRecordId: null,
        source: "portfolio-risk",
        recommendationType: "maintain",
        rationale: "Portfolio risk within acceptable structural band — continue monitoring",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    appendPreLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} risk mitigation recommendation(s)`,
    });

    return recommendations;
  }
}
