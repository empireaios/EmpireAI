import { buildBottleneckIntelligenceConfiguration } from "@empireai/pillow";
import type {
  BottleneckIntelligenceState,
  BniRunReport,
} from "@empireai/pillow";

function buildOfflineBottleneckIntelligenceState(): BottleneckIntelligenceState {
  const configuration = buildBottleneckIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-BNI-001",
    missionId: "X3-10",
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
      totalBottleneckRecords: 0,
      highSeverityCount: 0,
      averageImpact: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      throughputConstraintsDetected: 0,
      bottlenecksRanked: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Bottleneck Intelligence snapshot when Pillow session is unavailable. */
export function collectBottleneckIntelligenceSnapshot() {
  const engine = buildOfflineBottleneckIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBottleneckRecords: 0,
      highSeverityCount: 0,
      averageImpact: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as BniRunReport | null,
    bottleneckRecords: [],
    recommendations: [],
  };
}
