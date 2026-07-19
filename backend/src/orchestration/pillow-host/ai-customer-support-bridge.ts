import { buildAiCustomerSupportConfiguration } from "@empireai/pillow";
import type { AiSupportRunReport, AiCustomerSupportState } from "@empireai/pillow";

function buildOfflineAiCustomerSupportState(): AiCustomerSupportState {
  const configuration = buildAiCustomerSupportConfiguration();
  return {
    engineVersion: "PILLOW-ACS-001",
    missionId: "R4-08",
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
      totalAiSupportRecords: 0,
      openEnquiries: 0,
      escalatedEnquiries: 0,
      resolvedEnquiries: 0,
      failedEnquiries: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      enquiriesReceived: 0,
      intentsUnderstood: 0,
      contextsRetrieved: 0,
      responsesGenerated: 0,
      escalationsPerformed: 0,
      multiChannelHandled: 0,
      summariesGenerated: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
      averageResponseLatencyMs: 0,
    },
  };
}

/** Fallback AI Customer Support snapshot when Pillow session is unavailable. */
export function collectAiCustomerSupportSnapshot() {
  const engine = buildOfflineAiCustomerSupportState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAiSupportRecords: 0,
      openEnquiries: 0,
      escalatedEnquiries: 0,
      resolvedEnquiries: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as AiSupportRunReport | null,
    aiSupportRecords: [],
    summaries: [],
  };
}
