import { buildMarketplaceProductNormalizationConfiguration } from "@empireai/pillow";
import type {
  ProductNormalizationReport,
  MarketplaceProductNormalizationState,
} from "@empireai/pillow";

const UNIFIED_PRODUCT_SCHEMA_VERSION = "MPN-SCHEMA-001-v1";

function buildOfflineMarketplaceProductNormalizationState(): MarketplaceProductNormalizationState {
  const configuration = buildMarketplaceProductNormalizationConfiguration();
  return {
    engineVersion: "PILLOW-MPN-001",
    missionId: "R1-12",
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
      invalidProductsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      normalizationRuns: 0,
      productsNormalized: 0,
      duplicatesDetected: 0,
      invalidProductsDetected: 0,
      missingAttributeFindings: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketplace Product Normalization snapshot when Pillow session is unavailable. */
export function collectMarketplaceProductNormalizationSnapshot() {
  const engine = buildOfflineMarketplaceProductNormalizationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      catalogSize: 0,
      lastNormalizationAt: null,
      lastDecision: null,
      duplicatesDetected: 0,
      invalidProductsDetected: 0,
      schemaVersion: UNIFIED_PRODUCT_SCHEMA_VERSION,
      recentLogs: [],
    },
    latestReport: null as ProductNormalizationReport | null,
    catalog: [],
  };
}
