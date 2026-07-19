import { buildAttributionEngineConfiguration } from "@empireai/pillow";
import type { AttributionEngineState, AttributionRunReport } from "@empireai/pillow";

function buildOfflineAttributionEngineState(): AttributionEngineState {
  const configuration = buildAttributionEngineConfiguration();
  return {
    engineVersion: "PILLOW-ATT-001",
    missionId: "R5-09",
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
      totalAttributions: 0,
      totalTouchpoints: 0,
      averageRoiContribution: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      touchpointsTracked: 0,
      attributionsCalculated: 0,
      roiCalculations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Attribution Engine snapshot when Pillow session is unavailable. */
export function collectAttributionEngineSnapshot() {
  const engine = buildOfflineAttributionEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      attributionsCalculated: 0,
      touchpointsTracked: 0,
      averageRoiContribution: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as AttributionRunReport | null,
    attributionRecords: [],
    touchpoints: [],
  };
}
