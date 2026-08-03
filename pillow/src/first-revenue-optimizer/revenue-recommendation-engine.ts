/** X1-14 — Revenue Recommendation Engine (structural signals only). */

export class RevenueRecommendationEngine {
  generate(input: {
    productPerformanceScore: number;
    bottleneckSummary: string;
    underperformingSummary: string;
    pricingRecommendation: string;
    productPriorityOptimization: string;
  }): string {
    const items: string[] = [
      input.productPriorityOptimization,
      input.pricingRecommendation,
    ];
    if (input.bottleneckSummary !== "none") {
      items.push(`clear-bottlenecks:${input.bottleneckSummary}`);
    }
    if (input.underperformingSummary !== "none") {
      items.push("retire-or-reposition-underperformers");
    }
    if (input.productPerformanceScore >= 70) {
      items.push("scale-winning-offer-structurally");
    } else {
      items.push("tighten-first-sale-path");
    }
    return items.join(" · ");
  }
}
