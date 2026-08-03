import { buildEmpireSelfImprovementEngineConfiguration } from "@empireai/pillow";
import type { EmpireSelfImprovementRunReport, EmpireSelfImprovementState } from "@empireai/pillow";

/** Offline X5-09 snapshot used when the Pillow session is unavailable. */
export function collectEmpireSelfImprovementEngineSnapshot() {
  const configuration = buildEmpireSelfImprovementEngineConfiguration();
  const engine: EmpireSelfImprovementState = { engineVersion: "PILLOW-ESI-001", missionId: "X5-09", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null, health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalSelfImprovementRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] } };
  return { computedAt: new Date().toISOString(), missionId: "X5-09", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalSelfImprovementRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireSelfImprovementRunReport | null, selfImprovementRecords: [], recommendations: [] };
}
