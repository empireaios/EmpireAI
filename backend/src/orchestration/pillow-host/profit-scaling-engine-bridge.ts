import { buildProfitScalingEngineConfiguration } from "@empireai/pillow";

import type {

  ProfitScalingEngineState,

  PseRunReport,

} from "@empireai/pillow";



function buildOfflineProfitScalingEngineState(): ProfitScalingEngineState {

  const configuration = buildProfitScalingEngineConfiguration();

  return {

    engineVersion: "PILLOW-PSE-001",

    missionId: "X3-17",

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

      totalProfitScalingRecords: 0,

      highOptimizationCount: 0,

      averageOptimizationScore: 0,

      notes: ["Pillow session unavailable — offline snapshot"],

    },

    performance: {

      totalOperations: 0,

      successfulOperations: 0,

      failedOperations: 0,

      monitoringRuns: 0,

      erosionsDetected: 0,

      unprofitableGrowthDetected: 0,

      optimizationsPerformed: 0,

      recommendationsGenerated: 0,

      retryAttempts: 0,

      averageOperationDurationMs: 0,

      peakOperationDurationMs: 0,

    },

  };

}



/** Fallback Profit Scaling Engine snapshot when Pillow session is unavailable. */

export function collectProfitScalingEngineSnapshot() {

  const engine = buildOfflineProfitScalingEngineState();

  return {

    computedAt: new Date().toISOString(),

    missionId: "X3-17",

    live: false,

    engine,

    cockpit: {

      engineStatus: engine.status,

      healthStatus: engine.health.status,

      operationalState: null,

      lastDecision: null,

      totalProfitScalingRecords: 0,

      highOptimizationCount: 0,

      averageOptimizationScore: 0,

      frameworkRegistered: false,

      dependenciesConnected: 0,

      recentLogs: [] as string[],

    },

    latestReport: null as PseRunReport | null,

    profitScalingRecords: [],

    recommendations: [],

  };

}

