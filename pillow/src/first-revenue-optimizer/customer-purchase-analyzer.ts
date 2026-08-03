/** X1-14 — Customer Purchase Analyzer (structural signals only). */

export class CustomerPurchaseAnalyzer {
  analyze(input: {
    industry: string;
    hasMonitoring: boolean;
    customerActivitySummary: string | null;
    growthScore: number | null;
  }): string {
    const intent = input.hasMonitoring
      ? input.customerActivitySummary?.slice(0, 48) || "active-intent"
      : "latent-intent";
    const affinity = Math.max(20, Math.min(100, input.growthScore ?? 45));
    return [
      `purchase-intent=${intent}`,
      `affinity=${affinity}`,
      `industry=${input.industry}`,
      "structural",
    ].join(" · ");
  }
}
