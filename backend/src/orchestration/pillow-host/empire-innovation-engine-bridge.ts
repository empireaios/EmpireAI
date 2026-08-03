import { buildEmpireInnovationEngineConfiguration } from "@empireai/pillow";
import type { EmpireInnovationRunReport, EmpireInnovationState } from "@empireai/pillow";

/** Offline X5-07 snapshot used when the Pillow session is unavailable. */
export function collectEmpireInnovationEngineSnapshot() {
  const configuration = buildEmpireInnovationEngineConfiguration();
  const engine: EmpireInnovationState = {
    engineVersion: "PILLOW-EIN-001", missionId: "X5-07", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalInnovationRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-07", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalInnovationRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireInnovationRunReport | null, innovationRecords: [], recommendations: [] };
}
