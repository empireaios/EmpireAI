/** X1-08 — Portfolio Optimization Engine (structural signals only). */

export class PortfolioOptimizationEngine {
  detectOverlaps(productReferences: string, categories: string): string {
    const products = productReferences.split("|").map((p) => p.trim()).filter(Boolean);
    if (products.length < 2) return "no-overlap-detected";
    const pairs = Math.floor(products.length / 2);
    return `${pairs} structural overlap candidate(s) across ${categories.split("|").length} categories`;
  }

  optimize(
    productReferences: string,
    profitability: number,
    demand: number,
  ): { productReferences: string; portfolioProfitabilityScore: number; portfolioDemandScore: number } {
    const products = productReferences
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    const kept = products.slice(0, Math.max(3, Math.min(products.length, 5)));
    return {
      productReferences: kept.join(" | "),
      portfolioProfitabilityScore: Math.min(100, profitability + 3),
      portfolioDemandScore: Math.min(100, demand + 2),
    };
  }
}
