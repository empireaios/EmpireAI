/** X1-13 — Operational Monitoring Engine (structural signals only). */

export class OperationalMonitoringEngine {
  summarize(input: {
    industry: string;
    hasLaunch: boolean;
    hasGrowthPlan: boolean;
    alertThreshold: number;
  }): { summary: string; scoreContribution: number } {
    let score = 30;
    if (input.hasLaunch) score += 25;
    if (input.hasGrowthPlan) score += 20;
    score += Math.min(15, Math.round(input.alertThreshold / 10));
    return {
      summary: [
        `ops-signal=${input.hasLaunch ? "post-launch" : "pre-launch"}`,
        `growth-link=${input.hasGrowthPlan ? "present" : "missing"}`,
        `industry=${input.industry}`,
        `threshold=${input.alertThreshold}`,
      ].join(" · "),
      scoreContribution: Math.max(0, Math.min(100, score)),
    };
  }

  systemStability(input: {
    operationalScore: number;
    alertThreshold: number;
  }): string {
    const status =
      input.operationalScore >= input.alertThreshold ? "stable" : "elevated-risk";
    return `stability=${status} · score=${input.operationalScore} · threshold=${input.alertThreshold}`;
  }
}
