/** X2-03 — Company comparison engine. */

import { appendPpeLog } from "./ppe-logging.js";
import type { PortfolioPerformanceRecord } from "./types.js";

export class CompanyComparisonEngine {
  compare(records: PortfolioPerformanceRecord[]): PortfolioPerformanceRecord[] {
    const ranked = [...records]
      .sort((a, b) => b.overallPerformanceScore - a.overallPerformanceScore)
      .map((record, index) => ({
        ...record,
        ranking: index + 1,
        timestamp: new Date().toISOString(),
      }));

    appendPpeLog({
      event: "company_comparison",
      level: "info",
      details: `Compared ${ranked.length} companies objectively`,
    });

    return ranked;
  }
}
