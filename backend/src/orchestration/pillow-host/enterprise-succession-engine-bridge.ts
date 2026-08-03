import { buildEnterpriseSuccessionEngineConfiguration } from "@empireai/pillow";
import type { EnterpriseSuccessionRunReport, EnterpriseSuccessionState } from "@empireai/pillow";

/** Offline X5-13 snapshot used when the Pillow session is unavailable. */
export function collectEnterpriseSuccessionEngineSnapshot() {
  const configuration = buildEnterpriseSuccessionEngineConfiguration();
  const engine: EnterpriseSuccessionState = {
    engineVersion: "PILLOW-ESE-001",
    missionId: "X5-13",
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
      totalSuccessionRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSuccessionRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EnterpriseSuccessionRunReport | null,
    successionRecords: [],
    recommendations: [],
  };
}
