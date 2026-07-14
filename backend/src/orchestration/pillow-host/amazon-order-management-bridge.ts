import { buildAmazonOrderManagementConfiguration } from "@empireai/pillow";
import type {
  AmazonOrderSyncReport,
  AmazonOrderManagementState,
} from "@empireai/pillow";

function buildOfflineAmazonOrderManagementState(): AmazonOrderManagementState {
  const configuration = buildAmazonOrderManagementConfiguration();
  return {
    engineVersion: "PILLOW-AMZO-001",
    missionId: "R1-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    orders: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      orderCount: 0,
      lastSyncAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      syncFailures: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      syncRuns: 0,
      ordersFetched: 0,
      ordersSynced: 0,
      newOrdersDetected: 0,
      updatedOrdersDetected: 0,
      cancelledOrdersDetected: 0,
      fulfilledOrdersDetected: 0,
      refundedOrdersDetected: 0,
      lifecycleEventsProcessed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Amazon Order Management snapshot when Pillow session is unavailable. */
export function collectAmazonOrderManagementSnapshot() {
  const engine = buildOfflineAmazonOrderManagementState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      orderCount: 0,
      lastSyncAt: null,
      lastDecision: null,
      newOrdersDetected: 0,
      cancelledOrdersDetected: 0,
      fulfilledOrdersDetected: 0,
      recentLogs: [],
    },
    latestReport: null as AmazonOrderSyncReport | null,
    orders: [],
  };
}
