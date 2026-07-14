import { randomUUID } from "node:crypto";
import type {
  GuardianAlertRecord,
  GuardianMonitoringSnapshot,
  HealthClassification,
} from "./types.js";

/** Classify and generate alerts from live snapshot (P5-04). */
export function generateAlertsFromSnapshot(
  snapshot: GuardianMonitoringSnapshot,
): GuardianAlertRecord[] {
  const alerts: GuardianAlertRecord[] = [];
  const ts = snapshot.capturedAt;

  if (snapshot.eventLoopLagMs >= 500) {
    alerts.push(buildAlert({
      component: "GM-CPU",
      severity: "critical",
      symptoms: `Event loop lag ${snapshot.eventLoopLagMs}ms`,
      cause: "Event loop starvation or blocking operation",
      action: "Review BR-BN bottlenecks · yield event loop · reduce sync work",
      ts,
    }));
  } else if (snapshot.eventLoopLagMs >= 200) {
    alerts.push(buildAlert({
      component: "GM-CPU",
      severity: "medium",
      symptoms: `Event loop lag ${snapshot.eventLoopLagMs}ms`,
      cause: "Elevated event loop pressure",
      action: "Monitor runtime · check queue depth and Pillow boot chain",
      ts,
    }));
  }

  if (!snapshot.redisConnected && snapshot.nodeEnv === "production") {
    alerts.push(buildAlert({
      component: "GM-REDIS",
      severity: "high",
      symptoms: "Redis disconnected in production",
      cause: "REDIS_URL unavailable or probe failed",
      action: "Restore Redis · auth and queue in degraded mode",
      ts,
    }));
  } else if (snapshot.redisMode === "degraded") {
    alerts.push(buildAlert({
      component: "GM-REDIS",
      severity: "medium",
      symptoms: "Redis degraded mode active",
      cause: "Queue and sessions may use in-memory fallback",
      action: "Verify REDIS_URL · check Upstash connectivity",
      ts,
    }));
  }

  if (snapshot.authStoreMode === "in_memory" && snapshot.nodeEnv === "production") {
    alerts.push(buildAlert({
      component: "GM-AUTH",
      severity: "high",
      symptoms: "Auth sessions in-memory in production",
      cause: "Redis unavailable — sessions lost on Brain restart",
      action: "Enable Redis for durable auth sessions",
      ts,
    }));
  }

  if (!snapshot.sqliteHealthy) {
    alerts.push(buildAlert({
      component: "GM-DB",
      severity: "critical",
      symptoms: "SQLite integrity check failed",
      cause: "Database corruption or volume issue",
      action: "Run DatabaseGuardian recovery · check Railway volume",
      ts,
    }));
  }

  if (!snapshot.workersActive && snapshot.nodeEnv === "production" && snapshot.queueDepth > 0) {
    alerts.push(buildAlert({
      component: "GM-WORKERS",
      severity: "medium",
      symptoms: `Queue depth ${snapshot.queueDepth} with no active workers`,
      cause: "worker.ts not running in production",
      action: "Start backend/src/worker.ts · verify Redis connection",
      ts,
    }));
  }

  if (!snapshot.pillowHostRunning) {
    alerts.push(buildAlert({
      component: "GM-PILLOW",
      severity: "low",
      symptoms: "Pillow host not running",
      cause: "Lazy boot or host stopped",
      action: "Schedule pillow host boot · expect 503 during start",
      ts,
    }));
  }

  if (!snapshot.apiHealthy) {
    alerts.push(buildAlert({
      component: "GM-API",
      severity: "critical",
      symptoms: "API unresponsive",
      cause: "Event loop blocked or Brain unavailable",
      action: "Check /health/live · review dispatch path",
      ts,
    }));
  }

  if (snapshot.openGuardianRisks && snapshot.openGuardianRisks > 0) {
    alerts.push(buildAlert({
      component: "GM-BRAIN-RT",
      severity: snapshot.openGuardianRisks > 3 ? "high" : "low",
      symptoms: `${snapshot.openGuardianRisks} open Guardian risks`,
      cause: "Backend Guardian risk registry has unresolved items",
      action: "Review /guardian/health · resolve risks via Supervisor",
      ts,
    }));
  }

  if (snapshot.heapUsedMb > 0 && snapshot.heapTotalMb > 0) {
    const pct = (snapshot.heapUsedMb / snapshot.heapTotalMb) * 100;
    if (pct > 85) {
      alerts.push(buildAlert({
        component: "GM-MEMORY",
        severity: "high",
        symptoms: `Heap ${Math.round(pct)}% utilized (${snapshot.heapUsedMb}/${snapshot.heapTotalMb} MB)`,
        cause: "Memory pressure — possible leak or large working set",
        action: "Review tool registration · check Pillow session memory",
        ts,
      }));
    } else if (pct > 70) {
      alerts.push(buildAlert({
        component: "GM-MEMORY",
        severity: "low",
        symptoms: `Heap ${Math.round(pct)}% utilized`,
        cause: "Elevated memory usage",
        action: "Monitor trend · plan restart if climbing",
        ts,
      }));
    }
  }

  if (alerts.length === 0) {
    alerts.push(buildAlert({
      component: "GM-PROD",
      severity: "informational",
      symptoms: "No active degradations detected",
      cause: "All monitored components within thresholds",
      action: "Continue observation",
      ts,
      status: "resolved",
    }));
  }

  return alerts;
}

function buildAlert(input: {
  component: string;
  severity: GuardianAlertRecord["severity"];
  symptoms: string;
  cause: string;
  action: string;
  ts: string;
  status?: GuardianAlertRecord["currentStatus"];
}): GuardianAlertRecord {
  return {
    alertId: `GM-ALT-${randomUUID().slice(0, 8)}`,
    timestamp: input.ts,
    affectedComponent: input.component,
    severity: input.severity,
    observedSymptoms: input.symptoms,
    probableCause: input.cause,
    recommendedAction: input.action,
    currentStatus: input.status ?? "open",
  };
}

export function classifyOverallHealth(input: {
  alerts: GuardianAlertRecord[];
  snapshot: GuardianMonitoringSnapshot;
}): HealthClassification {
  const open = input.alerts.filter((a) => a.currentStatus === "open");
  if (open.some((a) => a.severity === "critical")) return "critical";
  if (!input.snapshot.apiHealthy) return "critical";
  if (open.some((a) => a.severity === "high")) return "degraded";
  if (open.some((a) => a.severity === "medium")) return "degraded";
  if (open.some((a) => a.severity === "low")) return "warning";
  if (input.snapshot.eventLoopLagMs >= 200) return "warning";
  return "healthy";
}
