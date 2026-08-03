import { buildWorkforceIntelligenceConfiguration } from "@empireai/pillow";
import type {
  WorkforceIntelligenceState,
  WfiRunReport,
} from "@empireai/pillow";

function buildOfflineWorkforceIntelligenceState(): WorkforceIntelligenceState {
  const configuration = buildWorkforceIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-WFI-001",
    missionId: "X3-08",
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
      totalWorkforceRecords: 0,
      bottleneckCount: 0,
      averageEfficiency: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      underutilizedAgentsDetected: 0,
      bottlenecksDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Workforce Intelligence snapshot when Pillow session is unavailable. */
export function collectWorkforceIntelligenceSnapshot() {
  const engine = buildOfflineWorkforceIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalWorkforceRecords: 0,
      bottleneckCount: 0,
      averageEfficiency: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as WfiRunReport | null,
    workforceRecords: [],
    recommendations: [],
  };
}
