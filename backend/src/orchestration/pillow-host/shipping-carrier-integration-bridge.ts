import { buildShippingCarrierIntegrationConfiguration } from "@empireai/pillow";
import type { ShipmentReport, ShippingCarrierIntegrationState } from "@empireai/pillow";

function buildOfflineShippingCarrierIntegrationState(): ShippingCarrierIntegrationState {
  const configuration = buildShippingCarrierIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-SCI-001",
    missionId: "R2-11",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    carriers: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      shipmentCount: 0,
      registeredCarriers: 0,
      lastShipmentAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      carrierFailures: 0,
      labelsGenerated: 0,
      invalidRequestsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      shipmentRequests: 0,
      labelsGenerated: 0,
      ratesRequested: 0,
      carriersRegistered: 0,
      carrierFailures: 0,
      invalidRequestsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Shipping Carrier Integration snapshot when Pillow session is unavailable. */
export function collectShippingCarrierIntegrationSnapshot() {
  const engine = buildOfflineShippingCarrierIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      shipmentCount: 0,
      registeredCarriers: 0,
      lastShipmentAt: null,
      lastDecision: null,
      labelsGenerated: 0,
      carrierFailures: 0,
      recentLogs: [],
    },
    latestReport: null as ShipmentReport | null,
    records: [],
    carriers: [],
  };
}
