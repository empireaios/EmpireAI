import { buildExecutiveEmpireDashboardConfiguration } from "@empireai/pillow";
/** Safe structural fallback while the Pillow host is starting. */
export function collectExecutiveEmpireDashboardSnapshot() {
  const configuration = buildExecutiveEmpireDashboardConfiguration();
  return {
    computedAt: new Date().toISOString(), missionId: "X5-10", live: false,
    engine: { engineVersion: "PILLOW-EED-001", missionId: "X5-10", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null, health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, totalDashboardRecords: 0, notes: ["Pillow session unavailable — structural offline snapshot"] } },
    cockpit: { engineStatus: "idle", healthStatus: "standby", operationalState: null, lastDecision: null, totalDashboardRecords: 0, alertCount: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] },
    dashboardRecords: [], recommendations: [],
  };
}
