import { buildCrossEmpireGovernanceEngineConfiguration } from "@empireai/pillow";
import type { CrossEmpireGovernanceRunReport, CrossEmpireGovernanceState } from "@empireai/pillow";

/** Offline X5-11 snapshot used when the Pillow session is unavailable. */
export function collectCrossEmpireGovernanceEngineSnapshot() {
  const configuration = buildCrossEmpireGovernanceEngineConfiguration();
  const engine: CrossEmpireGovernanceState = {
    engineVersion: "PILLOW-CEG-001",
    missionId: "X5-11",
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
      totalGovernanceRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalGovernanceRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CrossEmpireGovernanceRunReport | null,
    governanceRecords: [],
    recommendations: [],
  };
}
