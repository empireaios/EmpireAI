/** X1-14 — Revenue Analysis Engine (structural signals only). */

export class RevenueAnalysisEngine {
  monitorFirstSales(input: {
    industry: string;
    hasMonitoring: boolean;
    salesSummary: string | null;
  }): string {
    const signal = input.hasMonitoring
      ? input.salesSummary?.slice(0, 64) || "monitoring-linked"
      : "awaiting-first-sales-signal";
    return `first-sales=${signal} · industry=${input.industry} · structural`;
  }

  analyzeEarlyRevenue(input: {
    industry: string;
    growthScore: number | null;
    operationalHealthScore: number | null;
    hasMonitoring: boolean;
  }): string {
    const index = Math.round(
      ((input.growthScore ?? 40) + (input.operationalHealthScore ?? 40)) / 2,
    );
    return [
      `early-revenue-index=${index}`,
      `window=${input.hasMonitoring ? "post-launch" : "pre-signal"}`,
      `industry=${input.industry}`,
      "structural",
    ].join(" · ");
  }

  detectBottlenecks(input: {
    productPerformanceScore: number;
    operationalHealthScore: number | null;
    hasPricing: boolean;
  }): string {
    const issues: string[] = [];
    if (input.productPerformanceScore < 55) issues.push("weak-product-conversion");
    if ((input.operationalHealthScore ?? 50) < 60) issues.push("operational-friction");
    if (!input.hasPricing) issues.push("pricing-clarity-gap");
    return issues.length ? issues.join(" · ") : "none";
  }
}
