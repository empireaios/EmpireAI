/** X1-14 — Product Performance Engine (structural signals only). */

export class ProductPerformanceEngine {
  score(input: {
    portfolioProfitabilityScore: number | null;
    portfolioDemandScore: number | null;
    hasPortfolio: boolean;
    evaluationEnabled: boolean;
  }): number {
    if (!input.evaluationEnabled) return 50;
    if (!input.hasPortfolio) return 35;
    const profit = input.portfolioProfitabilityScore ?? 40;
    const demand = input.portfolioDemandScore ?? 40;
    return Math.max(0, Math.min(100, Math.round(profit * 0.55 + demand * 0.45)));
  }

  detectUnderperforming(input: {
    productPerformanceScore: number;
    productReferences: string | null;
  }): string {
    if (input.productPerformanceScore >= 60) return "none";
    const hint = input.productReferences?.slice(0, 48) || "core-offer";
    return `underperforming=${hint} · score=${input.productPerformanceScore}`;
  }

  optimizePriorities(input: {
    productPerformanceScore: number;
    underperformingSummary: string;
  }): string {
    if (input.underperformingSummary === "none") {
      return `prioritize-winners · score=${input.productPerformanceScore}`;
    }
    return `rebalance-portfolio · demote-underperformers · score=${input.productPerformanceScore}`;
  }
}
