import { buildRegressionProtectionConfiguration } from "@empireai/pillow";
import type { RegressionProtectionState, RegressionRunReport } from "@empireai/pillow";

function buildOfflineRegressionState(): RegressionProtectionState {
  const configuration = buildRegressionProtectionConfiguration();
  return {
    engineVersion: "PILLOW-RP-001",
    missionId: "T3-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      protectionEnabled: configuration.enabled,
      checksCompleted: 0,
      lastCheckAt: null,
      lastProtectionDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      regressionsDetectedTotal: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      totalRegressionsDetected: 0,
      blockedChanges: 0,
      averageRegressionsPerCheck: 0,
      averageCheckDurationMs: 0,
      peakCheckDurationMs: 0,
    },
  };
}

/** Fallback Regression Protection snapshot when Pillow session is unavailable. */
export function collectRegressionProtectionSnapshot() {
  const engine = buildOfflineRegressionState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      reportsCount: 0,
      regressionsCount: 0,
      blockedCount: 0,
      confidenceScore: 0,
      totalChecks: 0,
      recentLogs: [],
    },
    latestReport: null as RegressionRunReport | null,
  };
}
