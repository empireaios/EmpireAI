import { buildWhatsAppIntegrationConfiguration } from "@empireai/pillow";
import type { WhatsAppRunReport, WhatsAppIntegrationState } from "@empireai/pillow";

function buildOfflineWhatsAppIntegrationState(): WhatsAppIntegrationState {
  const configuration = buildWhatsAppIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-WAI-001",
    missionId: "R4-06",
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
      totalWhatsAppRecords: 0,
      queuedMessages: 0,
      deliveredMessages: 0,
      failedMessages: 0,
      activeConversations: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      messagesSent: 0,
      transactionalSent: 0,
      notificationSent: 0,
      templateSent: 0,
      inboundReceived: 0,
      templatesCreated: 0,
      conversationsManaged: 0,
      deliveriesTracked: 0,
      readReceiptsTracked: 0,
      failuresDetected: 0,
      queueProcessed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback WhatsApp Integration snapshot when Pillow session is unavailable. */
export function collectWhatsAppIntegrationSnapshot() {
  const engine = buildOfflineWhatsAppIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalWhatsAppRecords: 0,
      queuedMessages: 0,
      deliveredMessages: 0,
      activeConversations: 0,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as WhatsAppRunReport | null,
    whatsAppRecords: [],
    conversations: [],
    templates: [],
  };
}
