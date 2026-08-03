import { buildEmpireOptimizationEngineConfiguration } from "@empireai/pillow";
import type { EmpireOptimizationRunReport, EmpireOptimizationState } from "@empireai/pillow";

/** Offline X5-04 snapshot used when the Pillow session is unavailable. */
export function collectEmpireOptimizationEngineSnapshot() {
  const configuration = buildEmpireOptimizationEngineConfiguration();
  const engine: EmpireOptimizationState = {
    engineVersion: "PILLOW-EOE-001", missionId: "X5-04", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalOptimizationRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-04", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalOptimizationRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireOptimizationRunReport | null, optimizationRecords: [], recommendations: [] };
}
