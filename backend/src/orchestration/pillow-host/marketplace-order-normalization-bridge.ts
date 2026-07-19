import { buildMarketplaceOrderNormalizationConfiguration } from "@empireai/pillow";
import type {
  OrderNormalizationReport,
  MarketplaceOrderNormalizationState,
} from "@empireai/pillow";

const UNIFIED_ORDER_SCHEMA_VERSION = "MON-SCHEMA-001-v1";

function buildOfflineMarketplaceOrderNormalizationState(): MarketplaceOrderNormalizationState {
  const configuration = buildMarketplaceOrderNormalizationConfiguration();
  return {
    engineVersion: "PILLOW-MON-001",
    missionId: "R1-13",
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
      lastNormalizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      normalizationFailures: 0,
      duplicatesDetected: 0,
      invalidOrdersDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      normalizationRuns: 0,
      ordersNormalized: 0,
      duplicatesDetected: 0,
      invalidOrdersDetected: 0,
      missingAttributeFindings: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketplace Order Normalization snapshot when Pillow session is unavailable. */
export function collectMarketplaceOrderNormalizationSnapshot() {
  const engine = buildOfflineMarketplaceOrderNormalizationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      catalogSize: 0,
      lastNormalizationAt: null,
      lastDecision: null,
      duplicatesDetected: 0,
      invalidOrdersDetected: 0,
      schemaVersion: UNIFIED_ORDER_SCHEMA_VERSION,
      recentLogs: [],
    },
    latestReport: null as OrderNormalizationReport | null,
    catalog: [],
  };
}
