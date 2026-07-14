import {
  EVENT_LOOP_THRESHOLDS,
  MEMORY_THRESHOLDS,
  RUNTIME_GOVERNANCE_DOMAINS,
  RUNTIME_PRINCIPLES,
} from "./paths.js";
import { RUNTIME_BOTTLENECK_REGISTRY } from "./bottleneck-registry.js";
import type {
  BrainRuntimeSnapshot,
  RuntimeAssessmentResult,
  RuntimeDomainHealth,
  RuntimeHealthStatus,
} from "./types.js";

function statusFromLag(lagMs: number): RuntimeHealthStatus {
  if (lagMs >= EVENT_LOOP_THRESHOLDS.blocked) return "blocked";
  if (lagMs >= EVENT_LOOP_THRESHOLDS.degraded) return "degraded";
  return "healthy";
}

function assessDomains(snapshot: BrainRuntimeSnapshot | null): RuntimeDomainHealth[] {
  const lag = snapshot?.eventLoopLagMs ?? 0;
  const memRatio =
    snapshot && snapshot.heapTotalMb > 0
      ? snapshot.heapUsedMb / snapshot.heapTotalMb
      : 0;

  const domainStatus = (healthy: boolean, degraded = false): RuntimeHealthStatus =>
    healthy ? "healthy" : degraded ? "degraded" : "blocked";

  return RUNTIME_GOVERNANCE_DOMAINS.map((domain) => {
    switch (domain) {
      case "event_loop":
        return {
          domain,
          status: statusFromLag(lag),
          detail: `Lag ${lag}ms`,
        };
      case "memory":
        return {
          domain,
          status:
            memRatio >= MEMORY_THRESHOLDS.critical
              ? "blocked"
              : memRatio >= MEMORY_THRESHOLDS.degraded
                ? "degraded"
                : "healthy",
          detail: `Heap ${Math.round(memRatio * 100)}% used`,
        };
      case "redis":
        return {
          domain,
          status: snapshot?.redisMode === "connected" ? "healthy" : "degraded",
          detail: snapshot?.redisMode ?? "unknown",
        };
      case "queues":
        return {
          domain,
          status: domainStatus((snapshot?.queueDepth ?? 0) < 100, (snapshot?.queueDepth ?? 0) < 500),
          detail: `Depth ${snapshot?.queueDepth ?? 0}`,
        };
      case "workers":
        return {
          domain,
          status: "healthy",
          detail: snapshot?.workersActive ? "Workers active" : "API-only mode (worker.ts separate process)",
        };
      case "database":
        return {
          domain,
          status: snapshot?.sqliteHealthy !== false ? "healthy" : "degraded",
          detail: snapshot?.sqliteHealthy ? "SQLite OK" : "SQLite degraded",
        };
      case "api":
        return {
          domain,
          status: snapshot?.apiHealthy !== false ? "healthy" : "blocked",
          detail: snapshot?.apiHealthy ? "API responsive" : "API degraded",
        };
      case "authentication":
      case "sessions":
        return {
          domain,
          status: snapshot?.loginResponsive !== false ? "healthy" : "degraded",
          detail: snapshot?.loginResponsive ? "Login responsive" : "Login path slow",
        };
      case "runtime_health":
        return {
          domain,
          status: statusFromLag(lag),
          detail: `Overall lag ${lag}ms`,
        };
      default:
        return { domain, status: "healthy" as const, detail: "Governed" };
    }
  });
}

/** Execute runtime stability assessment (P5-01). */
export function executeRuntimeAssessment(input: {
  snapshot?: BrainRuntimeSnapshot | null;
}): RuntimeAssessmentResult {
  const snapshot = input.snapshot ?? null;
  const lag = snapshot?.eventLoopLagMs ?? 0;
  const domains = assessDomains(snapshot);

  const blockedDomains = domains.filter((d) => d.status === "blocked");
  const degradedDomains = domains.filter((d) => d.status === "degraded");

  const responsive =
    (snapshot?.brainResponsive ?? lag < EVENT_LOOP_THRESHOLDS.degraded) &&
    (snapshot?.pillowResponsive ?? true) &&
    (snapshot?.loginResponsive ?? true) &&
    (snapshot?.executiveHomeResponsive ?? true);

  const overallStatus: RuntimeHealthStatus =
    blockedDomains.length > 0 || lag >= EVENT_LOOP_THRESHOLDS.blocked
      ? "blocked"
      : lag >= EVENT_LOOP_THRESHOLDS.degraded || !responsive
        ? "degraded"
        : "healthy";

  const activeBottlenecks = RUNTIME_BOTTLENECK_REGISTRY.filter((b) => {
    if (b.id === "BR-BN-004" && snapshot?.redisMode === "degraded") return true;
    if (b.id === "BR-BN-005" && snapshot && !snapshot.workersActive) return true;
    if (b.id === "BR-BN-006" && lag >= EVENT_LOOP_THRESHOLDS.degraded) return true;
    return false;
  });

  const principles = RUNTIME_PRINCIPLES.map((principle) => {
    let satisfied = true;
    let detail = "Principle satisfied";
    if (principle === "no_event_loop_starvation") {
      satisfied = lag < EVENT_LOOP_THRESHOLDS.blocked;
      detail = `Event loop lag ${lag}ms`;
    }
    if (principle === "no_silent_degradation") {
      satisfied = activeBottlenecks.length === 0 || overallStatus !== "healthy";
      detail =
        activeBottlenecks.length > 0
          ? `${activeBottlenecks.length} active bottleneck(s) surfaced`
          : "No silent degradation";
    }
    if (principle === "graceful_degradation") {
      satisfied = overallStatus !== "blocked";
      detail = `Status: ${overallStatus}`;
    }
    return { principle, satisfied, detail };
  });

  const success = overallStatus !== "blocked" && responsive;

  return {
    pipelineVersion: "P5-01",
    assessedAt: new Date().toISOString(),
    overallStatus,
    responsive,
    domains,
    bottlenecks: RUNTIME_BOTTLENECK_REGISTRY,
    activeBottlenecks,
    snapshot,
    principles,
    success,
    summary: success
      ? "Brain runtime stable — responsive under current workload"
      : `Runtime ${overallStatus} — ${blockedDomains.length} blocked domain(s), responsive=${responsive}`,
  };
}

/** Default snapshot for dry-run / local assessment. */
export function buildDefaultRuntimeSnapshot(): BrainRuntimeSnapshot {
  const mem = process.memoryUsage();
  return {
    capturedAt: new Date().toISOString(),
    eventLoopLagMs: 0,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
    redisMode: "unknown",
    queueDepth: 0,
    workersActive: false,
    sqliteHealthy: true,
    apiHealthy: true,
    pillowResponsive: true,
    loginResponsive: true,
    executiveHomeResponsive: true,
    brainResponsive: true,
  };
}
