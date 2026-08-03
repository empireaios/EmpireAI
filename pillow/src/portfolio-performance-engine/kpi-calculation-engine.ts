/** X2-03 — Portfolio KPI calculation engine. */

import { appendPpeLog } from "./ppe-logging.js";
import type { PortfolioKpiSnapshot, PortfolioPerformanceRecord } from "./types.js";

export class KpiCalculationEngine {
  calculate(records: PortfolioPerformanceRecord[]): PortfolioKpiSnapshot {
    if (records.length === 0) {
      return {
        kpiId: `ppe-kpi-${Date.now()}`,
        timestamp: new Date().toISOString(),
        averagePerformanceScore: 0,
        medianPerformanceScore: 0,
        topPerformerReference: null,
        bottomPerformerReference: null,
        companiesMeasured: 0,
        portfolioSpread: 0,
        structuralSignalOnly: true,
      };
    }

    const scores = records
      .map((r) => r.overallPerformanceScore)
      .sort((a, b) => a - b);
    const averagePerformanceScore = Math.round(
      scores.reduce((sum, s) => sum + s, 0) / scores.length,
    );
    const mid = Math.floor(scores.length / 2);
    const medianPerformanceScore =
      scores.length % 2 === 0
        ? Math.round((scores[mid - 1]! + scores[mid]!) / 2)
        : scores[mid]!;

    const sortedByScore = [...records].sort(
      (a, b) => b.overallPerformanceScore - a.overallPerformanceScore,
    );
    const top = sortedByScore[0]!;
    const bottom = sortedByScore[sortedByScore.length - 1]!;

    const snapshot: PortfolioKpiSnapshot = {
      kpiId: `ppe-kpi-${Date.now()}`,
      timestamp: new Date().toISOString(),
      averagePerformanceScore,
      medianPerformanceScore,
      topPerformerReference: top.companyReference,
      bottomPerformerReference: bottom.companyReference,
      companiesMeasured: records.length,
      portfolioSpread: top.overallPerformanceScore - bottom.overallPerformanceScore,
      structuralSignalOnly: true,
    };

    appendPpeLog({
      event: "kpi_calculation",
      level: "info",
      details: `KPIs for ${records.length} companies · avg=${averagePerformanceScore}`,
    });

    return snapshot;
  }
}
