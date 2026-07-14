import type {
  GuardianAlertRecord,
  GuardianMonitoringAssessment,
  GuardianMonitoringSnapshot,
  HistoricalTimelineEntry,
  HealthClassification,
} from "./types.js";

const MAX_TIMELINE = 50;

/** In-session historical monitoring store (P5-04). */
export class HistoricalMonitoringStore {
  private timeline: HistoricalTimelineEntry[] = [];

  recordAssessment(assessment: GuardianMonitoringAssessment): void {
    this.timeline.push({
      timestamp: assessment.assessedAt,
      kind: "health",
      label: "Overall Health Assessment",
      detail: assessment.summary,
      health: assessment.overallHealth,
    });

    for (const alert of assessment.alerts) {
      if (alert.currentStatus === "open" && alert.severity !== "informational") {
        this.timeline.push({
          timestamp: alert.timestamp,
          kind: "alert",
          label: `${alert.affectedComponent} — ${alert.severity}`,
          detail: alert.observedSymptoms,
          health: severityToHealth(alert.severity),
        });
      }
    }

    if (assessment.snapshot) {
      this.timeline.push({
        timestamp: assessment.snapshot.capturedAt,
        kind: "performance",
        label: "Runtime Metrics",
        detail: `Lag ${assessment.snapshot.eventLoopLagMs}ms · Heap ${assessment.snapshot.heapUsedMb}MB · Queue ${assessment.snapshot.queueDepth}`,
        health: assessment.runtimeHealth,
      });
    }

    if (this.timeline.length > MAX_TIMELINE) {
      this.timeline = this.timeline.slice(-MAX_TIMELINE);
    }
  }

  getTimeline(): HistoricalTimelineEntry[] {
    return [...this.timeline];
  }

  getHealthTimeline(): HistoricalTimelineEntry[] {
    return this.timeline.filter((e) => e.kind === "health");
  }

  getAlertHistory(): HistoricalTimelineEntry[] {
    return this.timeline.filter((e) => e.kind === "alert");
  }

  getPerformanceTimeline(): HistoricalTimelineEntry[] {
    return this.timeline.filter((e) => e.kind === "performance");
  }

  analyzeTrend(): "improving" | "stable" | "degrading" {
    const healthEntries = this.getHealthTimeline();
    if (healthEntries.length < 2) return "stable";
    const recent = healthEntries.slice(-3);
    const scores = recent.map((e) => healthScore(e.health));
    if (scores[scores.length - 1]! < scores[0]!) return "degrading";
    if (scores[scores.length - 1]! > scores[0]!) return "improving";
    return "stable";
  }
}

function severityToHealth(severity: GuardianAlertRecord["severity"]): HealthClassification {
  if (severity === "critical") return "critical";
  if (severity === "high") return "degraded";
  if (severity === "medium") return "warning";
  return "healthy";
}

function healthScore(h: HealthClassification): number {
  const map: Record<HealthClassification, number> = {
    healthy: 5,
    warning: 4,
    degraded: 3,
    critical: 1,
    unavailable: 0,
    recovering: 3,
    maintenance: 4,
    historical: 5,
  };
  return map[h] ?? 3;
}

export function buildDefaultMonitoringSnapshot(): GuardianMonitoringSnapshot {
  const mem = process.memoryUsage();
  const env = process.env;
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    eventLoopLagMs: 0,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
    redisConnected: Boolean(env.REDIS_URL),
    redisMode: env.REDIS_URL ? "connected" : "degraded",
    queueDepth: 0,
    workersActive: env.NODE_ENV !== "production",
    sqliteHealthy: true,
    apiHealthy: true,
    pillowHostRunning: false,
    pillowHostSessions: 0,
    authStoreMode: env.REDIS_URL ? "redis" : "in_memory",
  };
}
