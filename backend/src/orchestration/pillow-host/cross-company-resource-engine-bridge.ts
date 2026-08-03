import { buildCrossCompanyResourceEngineConfiguration } from "@empireai/pillow";
import type {
  CrossCompanyResourceEngineState,
  CrossCompanyResourceRunReport,
} from "@empireai/pillow";

function buildOfflineCrossCompanyResourceEngineState(): CrossCompanyResourceEngineState {
  const configuration = buildCrossCompanyResourceEngineConfiguration();
  return {
    engineVersion: "PILLOW-CCRE-001",
    missionId: "X2-11",
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
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalResourceRecords: 0,
      idleResources: 0,
      conflictCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      resourcesRegistered: 0,
      allocationsProposed: 0,
      idleDetections: 0,
      conflictDetections: 0,
      optimizationsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Cross-Company Resource Engine snapshot when Pillow session is unavailable. */
export function collectCrossCompanyResourceEngineSnapshot() {
  const engine = buildOfflineCrossCompanyResourceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalResourceRecords: 0,
      idleResources: 0,
      conflictCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CrossCompanyResourceRunReport | null,
    resourceRecords: [],
  };
}
