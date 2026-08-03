/** X2-08 — Diversification analysis engine. */

import { appendPbeLog } from "./pbe-logging.js";

export class DiversificationAnalysisEngine {
  measure(input: {
    companyCount: number;
    categoryCount: number;
    performanceSpread: number;
    knowledgeShared: number;
  }): number {
    const companyFactor = Math.min(40, input.companyCount * 12);
    const categoryFactor = Math.min(30, input.categoryCount * 10);
    const spreadFactor = Math.min(20, Math.round(input.performanceSpread / 5));
    const knowledgeFactor = input.knowledgeShared > 0 ? 10 : 0;
    const score = Math.min(100, companyFactor + categoryFactor + spreadFactor + knowledgeFactor);

    appendPbeLog({
      event: "diversification_analysis",
      level: "info",
      details: `Diversification score=${score} · companies=${input.companyCount} · categories=${input.categoryCount}`,
    });
    return score;
  }
}
