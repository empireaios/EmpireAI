import { buildOperationalElasticityEngineConfiguration } from "@empireai/pillow";
import type {
  OperationalElasticityEngineState,
  OeeRunReport,
} from "@empireai/pillow";

function buildOfflineOperationalElasticityEngineState(): OperationalElasticityEngineState {
  const configuration = buildOperationalElasticityEngineConfiguration();
  return {
    engineVersion: "PILLOW-OEE-001",
    missionId: "X3-11",
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
      totalElasticityRecords: 0,
      highUtilizationCount: 0,
      averageUtilization: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      capacityAdjustments: 0,
      overcapacityDetected: 0,
      undercapacityDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Operational Elasticity Engine snapshot when Pillow session is unavailable. */
export function collectOperationalElasticityEngineSnapshot() {
  const engine = buildOfflineOperationalElasticityEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalElasticityRecords: 0,
      highUtilizationCount: 0,
      averageUtilization: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as OeeRunReport | null,
    elasticityRecords: [],
    recommendations: [],
  };
}
