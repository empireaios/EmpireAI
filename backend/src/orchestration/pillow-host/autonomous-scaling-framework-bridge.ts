import { buildAutonomousScalingFrameworkConfiguration } from "@empireai/pillow";
import type {
  AutonomousScalingFrameworkState,
  ScalingFrameworkRunReport,
} from "@empireai/pillow";

function buildOfflineAutonomousScalingFrameworkState(): AutonomousScalingFrameworkState {
  const configuration = buildAutonomousScalingFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-ASF-001",
    missionId: "X3-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    registeredModules: [],
    health: {
      status: "standby",
      healthScore: 50,
      frameworkEnabled: configuration.enabled,
      registeredModules: 0,
      activeModules: 0,
      suspendedModules: 0,
      failedModules: 0,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalEventsRouted: 0,
      dataAbstractions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Autonomous Scaling Framework snapshot when Pillow session is unavailable. */
export function collectAutonomousScalingFrameworkSnapshot() {
  const engine = buildOfflineAutonomousScalingFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      registeredModules: 0,
      activeModules: 0,
      lastDecision: null,
      recentLogs: [],
    },
    latestReport: null as ScalingFrameworkRunReport | null,
    registeredModules: [],
  };
}
