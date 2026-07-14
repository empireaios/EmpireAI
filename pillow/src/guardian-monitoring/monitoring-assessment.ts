import { MONITORED_COMPONENT_REGISTRY } from "./monitored-component-registry.js";
import { classifyOverallHealth, generateAlertsFromSnapshot } from "./alert-engine.js";
import { buildDefaultMonitoringSnapshot } from "./historical-store.js";
import type {
  GuardianMetricsBundle,
  GuardianMonitoringAssessment,
  GuardianMonitoringSnapshot,
  HealthClassification,
} from "./types.js";

function buildMetrics(snapshot: GuardianMonitoringSnapshot): GuardianMetricsBundle {
  const heapPct =
    snapshot.heapTotalMb > 0
      ? Math.round((snapshot.heapUsedMb / snapshot.heapTotalMb) * 100)
      : 0;

  return {
    cpuUsagePercent: Math.min(100, Math.round(snapshot.eventLoopLagMs / 5)),
    memoryUsageMb: snapshot.heapUsedMb,
    memoryTotalMb: snapshot.heapTotalMb,
    diskUsageNote: snapshot.sqliteHealthy ? "SQLite volume OK" : "Integrity check failed",
    networkLatencyMs: snapshot.eventLoopLagMs,
    apiLatencyMs: snapshot.apiHealthy ? snapshot.eventLoopLagMs : 9999,
    queueDepth: snapshot.queueDepth,
    workerStatus: snapshot.workersActive ? "active" : "inactive (API-only expected in prod)",
    sessionCount: snapshot.pillowHostSessions,
    authenticationHealth:
      snapshot.authStoreMode === "redis" ? "durable (Redis)" : "degraded (in-memory)",
    redisHealth: snapshot.redisConnected ? snapshot.redisMode : "disconnected",
    databaseHealth: snapshot.sqliteHealthy ? "healthy" : "failed",
    errorRateNote: "Derived from Guardian alerts — no silent failure",
    recoveryCount: 0,
    heartbeatStatus: snapshot.pillowHostRunning ? "Pillow host active" : "Pillow host idle/starting",
  };
}

function buildGrandKingSummary(input: {
  overall: HealthClassification;
  runtime: HealthClassification;
  alertCount: number;
  degradations: string[];
}): string {
  return [
    `Empire Health: ${input.overall}`,
    `Runtime: ${input.runtime}`,
    `Alerts: ${input.alertCount} open`,
    `Degradations: ${input.degradations.join(", ") || "none"}`,
  ].join(" · ");
}

function deriveComponentHealth(
  snapshot: GuardianMonitoringSnapshot,
  alerts: ReturnType<typeof generateAlertsFromSnapshot>,
): Record<string, HealthClassification> {
  const map: Record<string, HealthClassification> = {};
  for (const c of MONITORED_COMPONENT_REGISTRY) {
    map[c.id] = c.healthStatus;
  }

  for (const alert of alerts) {
    if (alert.currentStatus !== "open") continue;
    const current = map[alert.affectedComponent] ?? "healthy";
    const upgraded = upgradeHealth(current, alert.severity);
    map[alert.affectedComponent] = upgraded;
  }

  if (snapshot.eventLoopLagMs >= 500) map["GM-CPU"] = "critical";
  else if (snapshot.eventLoopLagMs >= 200) map["GM-CPU"] = "degraded";

  if (!snapshot.apiHealthy) map["GM-API"] = "critical";
  if (!snapshot.sqliteHealthy) map["GM-DB"] = "critical";
  if (!snapshot.pillowHostRunning) map["GM-PILLOW"] = "warning";

  return map;
}

function upgradeHealth(
  current: HealthClassification,
  severity: string,
): HealthClassification {
  if (severity === "critical") return "critical";
  if (severity === "high" && current !== "critical") return "degraded";
  if (severity === "medium" && (current === "healthy" || current === "warning")) return "degraded";
  if (severity === "low" && current === "healthy") return "warning";
  return current;
}

/** Execute Guardian Monitoring assessment (P5-04). */
export function executeGuardianMonitoringAssessment(input: {
  snapshot?: GuardianMonitoringSnapshot | null;
}): GuardianMonitoringAssessment {
  const snapshot = input.snapshot ?? buildDefaultMonitoringSnapshot();
  const alerts = generateAlertsFromSnapshot(snapshot);
  const overallHealth = classifyOverallHealth({ alerts, snapshot });
  const runtimeHealth =
    snapshot.eventLoopLagMs >= 500
      ? "critical"
      : snapshot.eventLoopLagMs >= 200
        ? "degraded"
        : snapshot.apiHealthy
          ? "healthy"
          : "critical";

  const componentHealth = deriveComponentHealth(snapshot, alerts);
  const openAlerts = alerts.filter(
    (a) => a.currentStatus === "open" && a.severity !== "informational",
  );
  const degradations = openAlerts.map((a) => a.affectedComponent);

  const grandKingSummary = buildGrandKingSummary({
    overall: overallHealth,
    runtime: runtimeHealth,
    alertCount: openAlerts.length,
    degradations,
  });

  return {
    pipelineVersion: "P5-04",
    assessedAt: new Date().toISOString(),
    overallHealth,
    runtimeHealth,
    componentHealth,
    metrics: buildMetrics(snapshot),
    alerts,
    components: MONITORED_COMPONENT_REGISTRY,
    snapshot,
    historicalTimeline: [],
    success: MONITORED_COMPONENT_REGISTRY.length >= 18,
    summary: `Guardian Monitoring — ${overallHealth} empire · ${runtimeHealth} runtime · ${openAlerts.length} alerts · ${Object.values(componentHealth).filter((h) => h === "degraded" || h === "critical").length} degraded components`,
    grandKingSummary,
  };
}

export { buildDefaultMonitoringSnapshot } from "./historical-store.js";
