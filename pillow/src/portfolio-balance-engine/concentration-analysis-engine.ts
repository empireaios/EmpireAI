/** X2-08 — Concentration analysis engine. */

import { appendPbeLog } from "./pbe-logging.js";

export class ConcentrationAnalysisEngine {
  analyzeIndustry(categoryShares: number[]): number {
    if (categoryShares.length === 0) return 0;
    const maxShare = Math.max(...categoryShares);
    return Math.round(maxShare);
  }

  analyzeRevenue(performanceWeights: number[]): number {
    if (performanceWeights.length === 0) return 0;
    const total = performanceWeights.reduce((s, w) => s + w, 0) || 1;
    const maxShare = Math.max(...performanceWeights.map((w) => (w / total) * 100));
    return Math.round(maxShare);
  }

  analyzeCapital(allocationWeights: number[]): number {
    if (allocationWeights.length === 0) return 0;
    const total = allocationWeights.reduce((s, w) => s + w, 0) || 1;
    const maxShare = Math.max(...allocationWeights.map((w) => (w / total) * 100));
    return Math.round(maxShare);
  }

  summarize(input: {
    industryConcentrationScore: number;
    revenueConcentrationScore: number;
    capitalConcentrationScore: number;
  }): void {
    appendPbeLog({
      event: "concentration_analysis",
      level: "info",
      details: `Industry=${input.industryConcentrationScore} · revenue=${input.revenueConcentrationScore} · capital=${input.capitalConcentrationScore}`,
    });
  }
}
