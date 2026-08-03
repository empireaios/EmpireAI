import { buildGlobalScalingPlannerConfiguration } from "@empireai/pillow";

import type {

  GlobalScalingPlannerState,

  GspRunReport,

} from "@empireai/pillow";



function buildOfflineGlobalScalingPlannerState(): GlobalScalingPlannerState {

  const configuration = buildGlobalScalingPlannerConfiguration();

  return {

    engineVersion: "PILLOW-GSP-001",

    missionId: "X3-14",

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

      totalGlobalScalingRecords: 0,

      highPriorityCount: 0,

      averageReadinessScore: 0,

      notes: ["Pillow session unavailable — offline snapshot"],

    },

    performance: {

      totalOperations: 0,

      successfulOperations: 0,

      failedOperations: 0,

      evaluationRuns: 0,

      regionsIdentified: 0,

      countriesIdentified: 0,

      recommendationsGenerated: 0,

      retryAttempts: 0,

      averageOperationDurationMs: 0,

      peakOperationDurationMs: 0,

    },

  };

}



/** Fallback Global Scaling Planner snapshot when Pillow session is unavailable. */

export function collectGlobalScalingPlannerSnapshot() {

  const engine = buildOfflineGlobalScalingPlannerState();

  return {

    computedAt: new Date().toISOString(),

    missionId: "X3-14",

    live: false,

    engine,

    cockpit: {

      engineStatus: engine.status,

      healthStatus: engine.health.status,

      operationalState: null,

      lastDecision: null,

      totalGlobalScalingRecords: 0,

      highPriorityCount: 0,

      averageReadinessScore: 0,

      frameworkRegistered: false,

      dependenciesConnected: 0,

      recentLogs: [] as string[],

    },

    latestReport: null as GspRunReport | null,

    globalScalingRecords: [],

    recommendations: [],

  };

}


