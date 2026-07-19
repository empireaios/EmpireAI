import { buildSupplierPricingEngineConfiguration } from "@empireai/pillow";
import type {
  SupplierPricingSyncReport,
  SupplierPricingEngineState,
} from "@empireai/pillow";

function buildOfflineSupplierPricingEngineState(): SupplierPricingEngineState {
  const configuration = buildSupplierPricingEngineConfiguration();
  return {
    engineVersion: "PILLOW-SPE-001",
    missionId: "R2-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    pricing: [],
    history: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      pricingCount: 0,
      lastSynchronizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      synchronizationFailures: 0,
      priceIncreasesDetected: 0,
      priceDecreasesDetected: 0,
      anomaliesDetected: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      synchronizationRuns: 0,
      recordsSynchronized: 0,
      priceIncreasesDetected: 0,
      priceDecreasesDetected: 0,
      anomaliesDetected: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Pricing Engine snapshot when Pillow session is unavailable. */
export function collectSupplierPricingEngineSnapshot() {
  const engine = buildOfflineSupplierPricingEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      pricingCount: 0,
      historyCount: 0,
      lastSynchronizationAt: null,
      lastDecision: null,
      priceIncreasesDetected: 0,
      priceDecreasesDetected: 0,
      anomaliesDetected: 0,
      recentLogs: [],
    },
    latestReport: null as SupplierPricingSyncReport | null,
    pricing: [],
    history: [],
  };
}
