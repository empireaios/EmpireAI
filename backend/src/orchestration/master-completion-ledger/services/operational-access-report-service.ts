import type { OperationalAccessReport } from "../models/master-completion-ledger.js";
import type { AccessDashboard } from "../../../operational-access/models/access-dashboard.js";
import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";

/** MCL-001 — Operational Access Report (delegates to OAR-001/OAR-008). */
export function buildOperationalAccessReport(workspaceId: string): OperationalAccessReport {
  const dashboard: AccessDashboard = buildAccessDashboard(workspaceId, "co-grand-king");
  const amazon = dashboard.amazonReadiness;

  return {
    moduleId: "master-completion-ledger",
    missionId: "MCL-001-OAR",
    workspaceId,
    totalPlatforms: dashboard.summary.totalPlatforms,
    marketplaceProviders: dashboard.marketplaceReadiness.length + 1,
    connected: dashboard.summary.connected,
    verified: dashboard.connectedPlatforms.filter((p) =>
      ["VERIFIED", "READY", "ACTIVE"].includes(p.accessState),
    ).length,
    active: dashboard.summary.active,
    blocked: dashboard.summary.blocked,
    awaitingApproval: dashboard.requiredAuthorizations.length,
    amazonStatus: amazon.accessState,
    topBlockers: dashboard.revenueBlockingGaps.map((g) => `${g.platformId}: ${g.gap}`).slice(0, 8),
    computedAt: new Date().toISOString(),
  };
}
