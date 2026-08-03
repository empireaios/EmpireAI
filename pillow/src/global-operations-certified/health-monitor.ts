export class HealthMonitor {
  status(score: number) { return score >= 85 ? "healthy" as const : score ? "degraded" as const : "failed" as const; }
}
