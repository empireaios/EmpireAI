/** X2-03 — Performance recommendation engine. */

import { appendPpeLog } from "./ppe-logging.js";
import type {
  PerformanceRecommendation,
  PortfolioKpiSnapshot,
  PortfolioPerformanceRecord,
} from "./types.js";

export class PerformanceRecommendationEngine {
  recommend(
    records: PortfolioPerformanceRecord[],
    kpis: PortfolioKpiSnapshot | null,
    companyReference?: string,
  ): PerformanceRecommendation[] {
    const targets = companyReference
      ? records.filter((r) => r.companyReference === companyReference)
      : records;

    const recommendations: PerformanceRecommendation[] = [];

    for (const record of targets) {
      if (record.revenueMetrics.revenueIndex < 55) {
        recommendations.push(this.make(record.companyReference, "improve_revenue", "high", "Revenue index below portfolio threshold"));
      }
      if (record.profitabilityMetrics.profitabilityIndex < 55) {
        recommendations.push(this.make(record.companyReference, "improve_profitability", "high", "Profitability index needs structural uplift"));
      }
      if (record.operationalMetrics.operationalEfficiencyIndex < 55) {
        recommendations.push(this.make(record.companyReference, "improve_efficiency", "medium", "Operational efficiency lagging peers"));
      }
      if (record.growthMetrics.customerPerformanceIndex < 55) {
        recommendations.push(this.make(record.companyReference, "improve_customer", "medium", "Customer performance below target band"));
      }
      if (record.growthMetrics.growthIndex < 55) {
        recommendations.push(this.make(record.companyReference, "improve_growth", "medium", "Growth index underperforming"));
      }
      if (
        kpis &&
        record.overallPerformanceScore < kpis.averagePerformanceScore - 10
      ) {
        recommendations.push(this.make(record.companyReference, "rebalance_focus", "high", "Company underperforms portfolio average"));
      }
      if (recommendations.filter((r) => r.companyReference === record.companyReference).length === 0) {
        recommendations.push(this.make(record.companyReference, "maintain", "low", "Performance within healthy structural band"));
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(this.make(null, "maintain", "low", "No companies measured — register and measure first"));
    }

    appendPpeLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} recommendation(s)`,
    });

    return recommendations;
  }

  private make(
    companyReference: string | null,
    recommendationType: PerformanceRecommendation["recommendationType"],
    priority: PerformanceRecommendation["priority"],
    rationale: string,
  ): PerformanceRecommendation {
    return {
      recommendationId: `ppe-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      companyReference,
      recommendationType,
      rationale,
      priority,
      structuralSignalOnly: true,
    };
  }
}
