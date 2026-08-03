/** X2-06 — Portfolio KPI engine. */

import { appendEpdLog } from "./epd-logging.js";
import type { PortfolioKpiSummary } from "./types.js";

export class PortfolioKpiEngine {
  aggregate(input: {
    companiesMeasured: number;
    averagePerformanceScore: number;
    topPerformerReference: string | null;
    portfolioSpread: number;
    capitalEfficiencyHint?: number;
    knowledgeReuseHint?: number;
  }): PortfolioKpiSummary {
    const performanceWeight = input.averagePerformanceScore;
    const capitalWeight = input.capitalEfficiencyHint ?? 50;
    const knowledgeWeight = input.knowledgeReuseHint ?? 50;
    const overallKpiScore = Math.round(
      performanceWeight * 0.5 + capitalWeight * 0.25 + knowledgeWeight * 0.25,
    );

    const summary: PortfolioKpiSummary = {
      companiesMeasured: input.companiesMeasured,
      averagePerformanceScore: input.averagePerformanceScore,
      topPerformerReference: input.topPerformerReference,
      portfolioSpread: input.portfolioSpread,
      overallKpiScore,
    };

    appendEpdLog({
      event: "kpi_calculation",
      level: "info",
      details: `Aggregated portfolio KPIs · overall=${overallKpiScore}`,
    });

    return summary;
  }
}
