import { buildAutonomousGrowthOptimizerConfiguration } from "@empireai/pillow";
import type {
  AutonomousGrowthOptimizerState,
  AgoRunReport,
} from "@empireai/pillow";

function buildOfflineAutonomousGrowthOptimizerState(): AutonomousGrowthOptimizerState {
  const configuration = buildAutonomousGrowthOptimizerConfiguration();
  return {
    engineVersion: "PILLOW-AGO-001",
    missionId: "X3-15",
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
      totalGrowthOptimizationRecords: 0,
      highPriorityCount: 0,
      averageOpportunityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      opportunitiesIdentified: 0,
      constraintsIdentified: 0,
      strategiesOptimized: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Autonomous Growth Optimizer snapshot when Pillow session is unavailable. */
export function collectAutonomousGrowthOptimizerSnapshot() {
  const engine = buildOfflineAutonomousGrowthOptimizerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalGrowthOptimizationRecords: 0,
      highPriorityCount: 0,
      averageOpportunityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as AgoRunReport | null,
    growthOptimizationRecords: [],
    recommendations: [],
  };
}
