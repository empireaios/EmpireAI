import { buildEmpireLegacyEngineConfiguration } from "@empireai/pillow";
import type { EmpireLegacyRunReport, EmpireLegacyState } from "@empireai/pillow";

/** Offline X5-14 snapshot used when the Pillow session is unavailable. */
export function collectEmpireLegacyEngineSnapshot() {
  const configuration = buildEmpireLegacyEngineConfiguration();
  const engine: EmpireLegacyState = {
    engineVersion: "PILLOW-ELE-001",
    missionId: "X5-14",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      totalLegacyRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLegacyRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EmpireLegacyRunReport | null,
    legacyRecords: [],
    recommendations: [],
  };
}
