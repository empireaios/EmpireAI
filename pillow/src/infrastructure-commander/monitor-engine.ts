import type {
  AlertLevel,
  HealthStatus,
  InfrastructureMonitorSnapshot,
} from "./types.js";
import type { GitHubOrchestrationSnapshot } from "./types.js";
import type { RailwayOrchestrationSnapshot } from "./types.js";
import type { VercelOrchestrationSnapshot } from "./types.js";
import type { ApplicationHealthSnapshot } from "./types.js";

export function buildMonitorSnapshot(input: {
  github: GitHubOrchestrationSnapshot;
  railway: RailwayOrchestrationSnapshot;
  vercel: VercelOrchestrationSnapshot;
  application: ApplicationHealthSnapshot;
}): InfrastructureMonitorSnapshot {
  const activeRisks = [
    ...input.github.findings,
    ...input.railway.findings,
    ...input.vercel.findings,
    ...input.application.findings,
  ];

  const overallHealth = worstHealth([
    input.github.health,
    input.railway.health,
    input.vercel.health,
    input.application.health,
  ]);

  const productionReadiness =
    input.railway.health === "healthy" &&
    input.vercel.health === "healthy" &&
    input.application.health === "healthy" &&
    input.github.releaseReadiness !== "critical"
      ? "healthy"
      : overallHealth === "critical"
        ? "critical"
        : "degraded";

  const alertLevel = resolveAlertLevel(overallHealth, productionReadiness, activeRisks);

  return {
    monitoredAt: new Date().toISOString(),
    overallHealth,
    productionReadiness,
    alertLevel,
    github: input.github,
    railway: input.railway,
    vercel: input.vercel,
    application: input.application,
    activeRisks,
    executiveAttentionRequired: alertLevel === "executive_attention" || alertLevel === "critical",
  };
}

function worstHealth(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((s) => s === "unknown")) return "unknown";
  return "healthy";
}

function resolveAlertLevel(
  overall: HealthStatus,
  production: HealthStatus,
  risks: string[],
): AlertLevel {
  if (overall === "critical" || production === "critical") return "critical";
  if (overall === "degraded" || production === "degraded") {
    return risks.length > 3 ? "executive_attention" : "informational";
  }
  return "none";
}
