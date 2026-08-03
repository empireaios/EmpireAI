/** X2-03 — Portfolio analytics engine. */

import { appendPpeLog } from "./ppe-logging.js";
import type { PortfolioKpiSnapshot, PortfolioPerformanceRecord } from "./types.js";

export class PortfolioAnalyticsEngine {
  analyze(
    records: PortfolioPerformanceRecord[],
    kpis: PortfolioKpiSnapshot,
  ): {
    insights: string[];
    records: PortfolioPerformanceRecord[];
  } {
    const insights: string[] = [];
    if (records.length === 0) {
      insights.push("No performance records available for portfolio analytics");
    } else {
      insights.push(
        `Portfolio average score ${kpis.averagePerformanceScore} across ${kpis.companiesMeasured} companies`,
      );
      if (kpis.portfolioSpread >= 25) {
        insights.push("Wide performance spread — prioritize underperformer uplift");
      } else {
        insights.push("Performance spread is moderate — maintain comparative monitoring");
      }
      if (kpis.topPerformerReference) {
        insights.push(`Top structural performer: ${kpis.topPerformerReference}`);
      }
    }

    appendPpeLog({
      event: "portfolio_analytics",
      level: "info",
      details: `Analyzed ${records.length} performance record(s)`,
    });

    return { insights, records };
  }
}
