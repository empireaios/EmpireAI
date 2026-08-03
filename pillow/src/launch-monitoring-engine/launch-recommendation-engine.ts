/** X1-13 — Launch Recommendation Engine (structural signals only). */

export class LaunchRecommendationEngine {
  recommend(input: {
    operationalHealthScore: number;
    alertThreshold: number;
    detectedIssues: string;
    anomalySummary: string;
  }): string {
    const items: string[] = [];
    if (input.anomalySummary !== "none") items.push("investigate-detected-anomalies");
    if (input.detectedIssues !== "none") items.push("triage-operational-failures");
    if (input.operationalHealthScore < input.alertThreshold) {
      items.push("raise-operational-health-above-threshold");
    }
    if (input.operationalHealthScore >= input.alertThreshold) {
      items.push("maintain-monitoring-cadence");
    }
    items.push("preserve-traceability");
    return items.join(" · ");
  }
}
