/** X1-13 — Customer Activity Monitor (structural signals only). */

export class CustomerActivityMonitor {
  summarize(input: {
    industry: string;
    hasGrowthPlan: boolean;
    hasLaunch: boolean;
  }): { summary: string; scoreContribution: number } {
    let score = 25;
    if (input.hasLaunch) score += 30;
    if (input.hasGrowthPlan) score += 25;
    return {
      summary: [
        `sessions=${input.hasLaunch ? "warming" : "idle"}`,
        `acquisition-plan=${input.hasGrowthPlan ? "linked" : "unlinked"}`,
        `industry=${input.industry}`,
        "structural",
      ].join(" · "),
      scoreContribution: Math.max(0, Math.min(100, score)),
    };
  }
}
