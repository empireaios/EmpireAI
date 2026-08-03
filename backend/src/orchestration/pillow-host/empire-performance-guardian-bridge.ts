import { buildEmpirePerformanceGuardianConfiguration } from "@empireai/pillow";
import type { EmpirePerformanceGuardianRunReport, EmpirePerformanceGuardianState } from "@empireai/pillow";

/** Offline X5-18 snapshot used when the Pillow session is unavailable. */
export function collectEmpirePerformanceGuardianSnapshot() {
  const configuration = buildEmpirePerformanceGuardianConfiguration();
  const engine: EmpirePerformanceGuardianState = {
    engineVersion: "PILLOW-EPG-001",
    missionId: "X5-18",
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
      totalPerformanceRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPerformanceRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EmpirePerformanceGuardianRunReport | null,
    performanceRecords: [],
    recommendations: [],
  };
}
