/** X1-13 — Launch Health Analyzer (structural signals only). */

export class LaunchHealthAnalyzer {
  computeOperationalHealthScore(parts: {
    operational: number;
    sales: number;
    customer: number;
    scoringEnabled: boolean;
  }): number {
    if (!parts.scoringEnabled) return 50;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(parts.operational * 0.4 + parts.sales * 0.35 + parts.customer * 0.25),
      ),
    );
  }

  detectAnomalies(input: {
    operationalHealthScore: number;
    alertThreshold: number;
    hasLaunch: boolean;
    hasGrowthPlan: boolean;
  }): string {
    const issues: string[] = [];
    if (!input.hasLaunch) issues.push("missing-launch-reference");
    if (!input.hasGrowthPlan) issues.push("missing-growth-plan-link");
    if (input.operationalHealthScore < input.alertThreshold) {
      issues.push(`below-alert-threshold:${input.operationalHealthScore}<${input.alertThreshold}`);
    }
    return issues.length ? issues.join(" · ") : "none";
  }

  detectOperationalFailures(input: {
    operationalHealthScore: number;
    alertThreshold: number;
    anomalySummary: string;
  }): string {
    if (input.anomalySummary !== "none" && input.operationalHealthScore < input.alertThreshold) {
      return `operational-failure-risk · ${input.anomalySummary}`;
    }
    if (input.operationalHealthScore < Math.max(20, input.alertThreshold - 30)) {
      return "critical-operational-degradation";
    }
    return "none";
  }
}
