import { buildEmpireCapitalAllocationConfiguration } from "@empireai/pillow";
import type { EmpireCapitalAllocationRunReport, EmpireCapitalAllocationState } from "@empireai/pillow";

/** Offline X5-05 snapshot used when the Pillow session is unavailable. */
export function collectEmpireCapitalAllocationSnapshot() {
  const configuration = buildEmpireCapitalAllocationConfiguration();
  const engine: EmpireCapitalAllocationState = {
    engineVersion: "PILLOW-ECA-001", missionId: "X5-05", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalCapitalAllocationRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-05", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalCapitalAllocationRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireCapitalAllocationRunReport | null, capitalAllocationRecords: [], recommendations: [] };
}
