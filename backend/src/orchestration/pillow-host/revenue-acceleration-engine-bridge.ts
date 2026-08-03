import { buildRevenueAccelerationEngineConfiguration } from "@empireai/pillow";
import type {
  RevenueAccelerationEngineState,
  RaeRunReport,
} from "@empireai/pillow";

function buildOfflineRevenueAccelerationEngineState(): RevenueAccelerationEngineState {
  const configuration = buildRevenueAccelerationEngineConfiguration();
  return {
    engineVersion: "PILLOW-RAE-001",
    missionId: "X3-16",
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
      totalRevenueAccelerationRecords: 0,
      highOpportunityCount: 0,
      averageOpportunityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      opportunitiesIdentified: 0,
      bottlenecksIdentified: 0,
      strategiesOptimized: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Revenue Acceleration Engine snapshot when Pillow session is unavailable. */
export function collectRevenueAccelerationEngineSnapshot() {
  const engine = buildOfflineRevenueAccelerationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRevenueAccelerationRecords: 0,
      highOpportunityCount: 0,
      averageOpportunityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as RaeRunReport | null,
    revenueAccelerationRecords: [],
    recommendations: [],
  };
}
