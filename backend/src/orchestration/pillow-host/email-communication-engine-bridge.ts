import { buildEmailCommunicationEngineConfiguration } from "@empireai/pillow";
import type { EmailRunReport, EmailCommunicationEngineState } from "@empireai/pillow";

function buildOfflineEmailCommunicationEngineState(): EmailCommunicationEngineState {
  const configuration = buildEmailCommunicationEngineConfiguration();
  return {
    engineVersion: "PILLOW-ECE-001",
    missionId: "R4-04",
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
      totalEmailRecords: 0,
      queuedEmails: 0,
      deliveredEmails: 0,
      failedEmails: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      emailsSent: 0,
      transactionalSent: 0,
      marketingSent: 0,
      notificationSent: 0,
      supportSent: 0,
      templatesCreated: 0,
      opensTracked: 0,
      clicksTracked: 0,
      failuresDetected: 0,
      queueProcessed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Email Communication Engine snapshot when Pillow session is unavailable. */
export function collectEmailCommunicationEngineSnapshot() {
  const engine = buildOfflineEmailCommunicationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalEmailRecords: 0,
      queuedEmails: 0,
      deliveredEmails: 0,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as EmailRunReport | null,
    emailRecords: [],
    templates: [],
  };
}
