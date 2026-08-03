import { buildEmpireMemoryEngineConfiguration } from "@empireai/pillow";
import type { EmpireMemoryRunReport, EmpireMemoryState } from "@empireai/pillow";

/** Offline X5-03 snapshot used when the Pillow session is unavailable. */
export function collectEmpireMemoryEngineSnapshot() {
  const configuration = buildEmpireMemoryEngineConfiguration();
  const engine: EmpireMemoryState = {
    engineVersion: "PILLOW-EME-001", missionId: "X5-03", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalMemoryRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-03", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalMemoryRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireMemoryRunReport | null, memoryRecords: [], recommendations: [] };
}
