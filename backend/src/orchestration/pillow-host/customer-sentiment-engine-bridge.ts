import { buildCustomerSentimentEngineConfiguration } from "@empireai/pillow";
import type { CustomerSentimentEngineState, SentimentRunReport } from "@empireai/pillow";

function buildOfflineCustomerSentimentEngineState(): CustomerSentimentEngineState {
  const configuration = buildCustomerSentimentEngineConfiguration();
  return {
    engineVersion: "PILLOW-CSE-001",
    missionId: "R4-10",
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
      totalSentimentRecords: 0,
      positiveRecords: 0,
      negativeRecords: 0,
      frustratedRecords: 0,
      activeAlerts: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      messagesAnalyzed: 0,
      conversationsAnalyzed: 0,
      satisfactionDetected: 0,
      frustrationDetected: 0,
      escalationRiskDetected: 0,
      positiveExperiencesDetected: 0,
      trendsTracked: 0,
      scoresCalculated: 0,
      alertsGenerated: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Sentiment Engine snapshot when Pillow session is unavailable. */
export function collectCustomerSentimentEngineSnapshot() {
  const engine = buildOfflineCustomerSentimentEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSentimentRecords: 0,
      positiveRecords: 0,
      negativeRecords: 0,
      frustratedRecords: 0,
      activeAlerts: 0,
      timelineEngineConnected: false,
      aiCustomerSupportConnected: false,
      ticketManagementEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as SentimentRunReport | null,
    sentimentRecords: [],
    alerts: [],
    trends: [],
  };
}
