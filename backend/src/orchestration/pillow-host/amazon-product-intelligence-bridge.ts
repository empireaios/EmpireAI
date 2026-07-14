import { buildAmazonProductIntelligenceConfiguration } from "@empireai/pillow";
import type {
  AmazonProductSyncReport,
  AmazonProductIntelligenceState,
} from "@empireai/pillow";

function buildOfflineAmazonProductIntelligenceState(): AmazonProductIntelligenceState {
  const configuration = buildAmazonProductIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-AMZPI-001",
    missionId: "R1-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    catalog: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      catalogSize: 0,
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
      productsFetched: 0,
      productsSynced: 0,
      newProductsDetected: 0,
      updatedProductsDetected: 0,
      inactiveProductsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Amazon Product Intelligence snapshot when Pillow session is unavailable. */
export function collectAmazonProductIntelligenceSnapshot() {
  const engine = buildOfflineAmazonProductIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      catalogSize: 0,
      lastSyncAt: null,
      lastDecision: null,
      newProductsDetected: 0,
      updatedProductsDetected: 0,
      inactiveProductsDetected: 0,
      recentLogs: [],
    },
    latestReport: null as AmazonProductSyncReport | null,
    catalog: [],
  };
}
