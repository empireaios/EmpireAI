import { buildCustomerRiskEngineConfiguration } from "@empireai/pillow";
import type { CustomerRiskEngineState, CustomerRiskRunReport } from "@empireai/pillow";

function buildOfflineCustomerRiskEngineState(): CustomerRiskEngineState {
  const configuration = buildCustomerRiskEngineConfiguration();
  return {
    engineVersion: "PILLOW-CRE-001",
    missionId: "R4-14",
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
      totalCustomerRiskRecords: 0,
      activeAlerts: 0,
      highRiskCustomers: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      riskEvaluations: 0,
      fraudDetected: 0,
      abuseDetected: 0,
      purchasingFlags: 0,
      returnFlags: 0,
      communicationFlags: 0,
      scoresCalculated: 0,
      alertsGenerated: 0,
      mitigationsRecommended: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Risk snapshot when Pillow session is unavailable. */
export function collectCustomerRiskEngineSnapshot() {
  const engine = buildOfflineCustomerRiskEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCustomerRiskRecords: 0,
      activeAlerts: 0,
      highRiskCustomers: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as CustomerRiskRunReport | null,
    customerRiskRecords: [],
    alerts: [],
    failures: [],
  };
}
