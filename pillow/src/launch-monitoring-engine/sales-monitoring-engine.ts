/** X1-13 — Sales Monitoring Engine (structural signals only). */

export class SalesMonitoringEngine {
  summarize(input: {
    industry: string;
    growthScore: number | null;
    hasLaunch: boolean;
  }): { summary: string; scoreContribution: number } {
    const baseline = input.growthScore ?? (input.hasLaunch ? 50 : 20);
    const score = Math.max(0, Math.min(100, Math.round(baseline * 0.85 + (input.hasLaunch ? 10 : 0))));
    return {
      summary: [
        `sales-signal=${input.hasLaunch ? "active-window" : "awaiting-launch"}`,
        `index=${score}`,
        `industry=${input.industry}`,
        "structural",
      ].join(" · "),
      scoreContribution: score,
    };
  }

  orderActivity(input: { salesIndex: number; industry: string }): string {
    const orders = Math.max(0, Math.round(input.salesIndex / 10));
    return `orders-index=${orders} · industry=${input.industry} · structural`;
  }
}
