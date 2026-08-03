import { buildSelfBalancingEnterpriseConfiguration } from "@empireai/pillow";

import type {
  SelfBalancingEnterpriseState,
  SbeRunReport,
} from "@empireai/pillow";

function buildOfflineSelfBalancingEnterpriseState(): SelfBalancingEnterpriseState {
  const configuration = buildSelfBalancingEnterpriseConfiguration();
  return {
    engineVersion: "PILLOW-SBE-001",
    missionId: "X3-19",
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
      totalBalancingRecords: 0,
      highScoreCount: 0,
      averageBalanceScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      reallocationsPerformed: 0,
      optimizationsPerformed: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Self-Balancing Enterprise snapshot when Pillow session is unavailable. */
export function collectSelfBalancingEnterpriseSnapshot() {
  const engine = buildOfflineSelfBalancingEnterpriseState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-19",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBalancingRecords: 0,
      highScoreCount: 0,
      averageBalanceScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SbeRunReport | null,
    balancingRecords: [],
    recommendations: [],
  };
}
