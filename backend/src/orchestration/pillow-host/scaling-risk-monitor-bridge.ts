import { buildScalingRiskMonitorConfiguration } from "@empireai/pillow";
import type {
  ScalingRiskMonitorState,
  SrmRunReport,
} from "@empireai/pillow";

function buildOfflineScalingRiskMonitorState(): ScalingRiskMonitorState {
  const configuration = buildScalingRiskMonitorConfiguration();
  return {
    engineVersion: "PILLOW-SRM-001",
    missionId: "X3-13",
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
      totalScalingRiskRecords: 0,
      criticalRiskCount: 0,
      averageRiskProbability: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      uncontrolledExpansionDetected: 0,
      criticalRisksDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Scaling Risk Monitor snapshot when Pillow session is unavailable. */
export function collectScalingRiskMonitorSnapshot() {
  const engine = buildOfflineScalingRiskMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalScalingRiskRecords: 0,
      criticalRiskCount: 0,
      averageRiskProbability: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SrmRunReport | null,
    scalingRiskRecords: [],
    recommendations: [],
  };
}
