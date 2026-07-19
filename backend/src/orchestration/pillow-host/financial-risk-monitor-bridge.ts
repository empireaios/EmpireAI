import { buildFinancialRiskMonitorConfiguration } from "@empireai/pillow";
import type {
  FinancialRiskRunReport,
  FinancialRiskMonitorState,
} from "@empireai/pillow";

function buildOfflineFinancialRiskMonitorState(): FinancialRiskMonitorState {
  const configuration = buildFinancialRiskMonitorConfiguration();
  return {
    engineVersion: "PILLOW-FRM-001",
    missionId: "R3-15",
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
      totalRiskRecords: 0,
      lastRiskScore: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      healthChecksPerformed: 0,
      riskScoresCalculated: 0,
      anomaliesDetected: 0,
      thresholdBreachesDetected: 0,
      alertsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Financial Risk Monitor snapshot when Pillow session is unavailable. */
export function collectFinancialRiskMonitorSnapshot() {
  const engine = buildOfflineFinancialRiskMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRiskRecords: 0,
      lastRiskScore: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as FinancialRiskRunReport | null,
    riskRecords: [],
  };
}
