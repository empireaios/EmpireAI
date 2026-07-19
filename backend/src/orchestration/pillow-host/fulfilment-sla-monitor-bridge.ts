import { buildFulfilmentSlaMonitorConfiguration } from "@empireai/pillow";
import type { FulfilmentSlaMonitorState, SlaReport } from "@empireai/pillow";

function buildOfflineFulfilmentSlaMonitorState(): FulfilmentSlaMonitorState {
  const configuration = buildFulfilmentSlaMonitorConfiguration();
  return {
    engineVersion: "PILLOW-FSM-001",
    missionId: "R2-18",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    history: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      slaRecordCount: 0,
      lastMonitorAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      monitoringFailures: 0,
      breachCount: 0,
      riskCount: 0,
      alertsGenerated: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitorRuns: 0,
      ordersMonitored: 0,
      complianceScoresCalculated: 0,
      breachesDetected: 0,
      risksDetected: 0,
      alertsGenerated: 0,
      monitoringFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Fulfilment SLA Monitor snapshot when Pillow session is unavailable. */
export function collectFulfilmentSlaMonitorSnapshot() {
  const engine = buildOfflineFulfilmentSlaMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      slaRecordCount: 0,
      lastMonitorAt: null,
      lastDecision: null,
      breachCount: 0,
      riskCount: 0,
      alertsGenerated: 0,
      recentLogs: [],
    },
    latestReport: null as SlaReport | null,
    records: [],
    history: [],
  };
}
