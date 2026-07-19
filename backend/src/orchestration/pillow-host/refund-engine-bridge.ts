import { buildRefundEngineConfiguration } from "@empireai/pillow";
import type {
  RefundEngineRunReport,
  RefundEngineState,
} from "@empireai/pillow";

function buildOfflineRefundEngineState(): RefundEngineState {
  const configuration = buildRefundEngineConfiguration();
  return {
    engineVersion: "PILLOW-RF-001",
    missionId: "R3-10",
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
      totalRefundRecords: 0,
      aggregateRefundAmount: 0,
      lastRefundStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      refundRequestsCreated: 0,
      eligibilityValidations: 0,
      fullRefundsProcessed: 0,
      partialRefundsProcessed: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Refund Engine snapshot when Pillow session is unavailable. */
export function collectRefundEngineSnapshot() {
  const engine = buildOfflineRefundEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRefundRecords: 0,
      aggregateRefundAmount: 0,
      lastRefundStatus: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as RefundEngineRunReport | null,
    refundRecords: [],
  };
}
