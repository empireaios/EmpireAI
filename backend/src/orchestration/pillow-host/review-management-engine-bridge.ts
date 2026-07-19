import { buildReviewManagementEngineConfiguration } from "@empireai/pillow";
import type { ReviewManagementEngineState, ReviewRunReport } from "@empireai/pillow";

function buildOfflineReviewManagementEngineState(): ReviewManagementEngineState {
  const configuration = buildReviewManagementEngineConfiguration();
  return {
    engineVersion: "PILLOW-RME-001",
    missionId: "R4-11",
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
      totalReviewRecords: 0,
      positiveReviews: 0,
      negativeReviews: 0,
      neutralReviews: 0,
      activeAlerts: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      reviewsCollected: 0,
      reviewsImported: 0,
      sentimentsClassified: 0,
      negativeDetected: 0,
      positiveDetected: 0,
      trendsTracked: 0,
      alertsGenerated: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Review Management Engine snapshot when Pillow session is unavailable. */
export function collectReviewManagementEngineSnapshot() {
  const engine = buildOfflineReviewManagementEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalReviewRecords: 0,
      positiveReviews: 0,
      negativeReviews: 0,
      activeAlerts: 0,
      identityEngineConnected: false,
      timelineEngineConnected: false,
      sentimentEngineConnected: false,
      aiCustomerSupportConnected: false,
      recentLogs: [],
    },
    latestReport: null as ReviewRunReport | null,
    reviewRecords: [],
    alerts: [],
    trends: [],
  };
}
