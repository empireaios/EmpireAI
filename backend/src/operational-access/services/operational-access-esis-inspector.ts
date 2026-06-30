import { buildAccessDashboard } from "./access-dashboard-service.js";
import { buildEmpireAccessRegistry } from "./empire-access-registry-service.js";

export type OperationalAccessEsisReport = {
  summary: string;
  coveragePercent: number;
  totalPlatforms: number;
  connected: number;
  blocked: number;
  revenueBlockingGaps: number;
  architectureComplete: boolean;
  realCommerceReadinessPercent: number;
  missingAuthorizations: string[];
  highestPriorityAction: string | null;
};

/** OAR-009 — ESIS operational access coverage inspection. */
export function inspectOperationalAccessCoverage(
  workspaceId = "ws_empire_1",
  companyId = "co-grand-king",
): OperationalAccessEsisReport {
  const dashboard = buildAccessDashboard(workspaceId, companyId);
  const registry = buildEmpireAccessRegistry(workspaceId);

  const coveragePercent = registry.summary.totalPlatforms > 0
    ? Math.round(
        ((registry.summary.connected + registry.summary.verified + registry.summary.ready) /
          registry.summary.totalPlatforms) *
          100,
      )
    : 0;

  const missingAuthorizations = dashboard.requiredAuthorizations.map(
    (a) => `${a.displayName}: ${a.authorizationType}`,
  );

  return {
    summary: [
      `Operational Access: ${registry.summary.totalPlatforms} platforms`,
      `${registry.summary.connected} connected`,
      `${registry.summary.blocked} blocked`,
      `${registry.summary.revenueBlockingGaps} revenue-blocking gaps`,
      `architecture ${registry.summary.architectureComplete ? "complete" : "incomplete"}`,
    ].join("; "),
    coveragePercent,
    totalPlatforms: registry.summary.totalPlatforms,
    connected: registry.summary.connected,
    blocked: registry.summary.blocked,
    revenueBlockingGaps: registry.summary.revenueBlockingGaps,
    architectureComplete: registry.summary.architectureComplete,
    realCommerceReadinessPercent: dashboard.realCommerceReadinessPercent,
    missingAuthorizations,
    highestPriorityAction: dashboard.highestPriorityAccessAction?.action ?? null,
  };
}
