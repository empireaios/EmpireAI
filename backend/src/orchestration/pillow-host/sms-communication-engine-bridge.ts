import { buildSmsCommunicationEngineConfiguration } from "@empireai/pillow";
import type { SmsRunReport, SmsCommunicationEngineState } from "@empireai/pillow";

function buildOfflineSmsCommunicationEngineState(): SmsCommunicationEngineState {
  const configuration = buildSmsCommunicationEngineConfiguration();
  return {
    engineVersion: "PILLOW-SCE-001",
    missionId: "R4-05",
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
      totalSmsRecords: 0,
      queuedSms: 0,
      deliveredSms: 0,
      failedSms: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      smsSent: 0,
      transactionalSent: 0,
      notificationSent: 0,
      verificationSent: 0,
      templatesCreated: 0,
      confirmationsTracked: 0,
      retriesPerformed: 0,
      failuresDetected: 0,
      queueProcessed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback SMS Communication Engine snapshot when Pillow session is unavailable. */
export function collectSmsCommunicationEngineSnapshot() {
  const engine = buildOfflineSmsCommunicationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSmsRecords: 0,
      queuedSms: 0,
      deliveredSms: 0,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as SmsRunReport | null,
    smsRecords: [],
    templates: [],
  };
}
