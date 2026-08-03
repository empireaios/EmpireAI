import { buildRegionalGrowthOptimizerConfiguration } from "@empireai/pillow";
import type {
  RegionalGrowthOptimizerState,
  RgoRunReport,
} from "@empireai/pillow";

function buildOfflineRegionalGrowthOptimizerState(): RegionalGrowthOptimizerState {
  const configuration = buildRegionalGrowthOptimizerConfiguration();
  return {
    engineVersion: "PILLOW-RGO-001",
    missionId: "X4-14",
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
      totalOptimizationRecords: 0,
      opportunityCount: 0,
      bottleneckCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      businessPerformanceMonitors: 0,
      revenueMonitors: 0,
      profitabilityMonitors: 0,
      customerGrowthMonitors: 0,
      efficiencyMonitors: 0,
      opportunityDetections: 0,
      bottleneckDetections: 0,
      priorityRankings: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Regional Growth Optimizer snapshot when Pillow session is unavailable. */
export function collectRegionalGrowthOptimizerSnapshot() {
  const engine = buildOfflineRegionalGrowthOptimizerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalOptimizationRecords: 0,
      opportunityCount: 0,
      bottleneckCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as RgoRunReport | null,
    optimizationRecords: [],
    recommendations: [],
  };
}
