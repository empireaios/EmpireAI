import { buildGlobalExpansionSimulatorConfiguration } from "@empireai/pillow";
import type { GesRunReport, GlobalExpansionSimulatorState } from "@empireai/pillow";

/** Offline X4-17 snapshot used when the Pillow session is unavailable. */
export function collectGlobalExpansionSimulatorSnapshot() {
  const configuration = buildGlobalExpansionSimulatorConfiguration();
  const engine: GlobalExpansionSimulatorState = {
    engineVersion: "PILLOW-GES-001", missionId: "X4-17", status: "idle",
    initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalSimulationRecords: 0, notes: ["Pillow session unavailable — offline structural snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X4-17", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalSimulationRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as GesRunReport | null, simulationRecords: [], recommendations: [] };
}
