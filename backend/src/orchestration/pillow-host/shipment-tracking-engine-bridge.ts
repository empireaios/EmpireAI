import { buildShipmentTrackingEngineConfiguration } from "@empireai/pillow";
import type { ShipmentTrackingReport, ShipmentTrackingEngineState } from "@empireai/pillow";

function buildOfflineShipmentTrackingEngineState(): ShipmentTrackingEngineState {
  const configuration = buildShipmentTrackingEngineConfiguration();
  return {
    engineVersion: "PILLOW-STE-001",
    missionId: "R2-12",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      trackingCount: 0,
      lastSyncAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      trackingFailures: 0,
      deliveredCount: 0,
      delayedCount: 0,
      failedDeliveryCount: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      syncRuns: 0,
      recordsTracked: 0,
      eventsProcessed: 0,
      deliveredDetected: 0,
      delayedDetected: 0,
      failedDeliveriesDetected: 0,
      trackingFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Shipment Tracking Engine snapshot when Pillow session is unavailable. */
export function collectShipmentTrackingEngineSnapshot() {
  const engine = buildOfflineShipmentTrackingEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      trackingCount: 0,
      lastSyncAt: null,
      lastDecision: null,
      deliveredCount: 0,
      delayedCount: 0,
      failedDeliveryCount: 0,
      recentLogs: [],
    },
    latestReport: null as ShipmentTrackingReport | null,
    records: [],
  };
}
