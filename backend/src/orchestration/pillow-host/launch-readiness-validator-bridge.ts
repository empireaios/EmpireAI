import { buildLaunchReadinessValidatorConfiguration } from "@empireai/pillow";
import type {
  LaunchReadinessValidatorState,
  LaunchRunReport,
} from "@empireai/pillow";

function buildOfflineLaunchReadinessValidatorState(): LaunchReadinessValidatorState {
  const configuration = buildLaunchReadinessValidatorConfiguration();
  return {
    engineVersion: "PILLOW-LRV-001",
    missionId: "X1-10",
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
      totalReadinessRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      validationsRun: 0,
      scoringRuns: 0,
      blockerDetectionRuns: 0,
      recommendationRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Launch Readiness Validator snapshot when Pillow session is unavailable. */
export function collectLaunchReadinessValidatorSnapshot() {
  const engine = buildOfflineLaunchReadinessValidatorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalReadinessRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { LaunchRunReport };
