import { buildSupplierProductSyncConfiguration } from "@empireai/pillow";
import type {
  SupplierProductSyncReport,
  SupplierProductSyncState,
} from "@empireai/pillow";

const SUPPLIER_PRODUCT_CATALOG_VERSION = "SPS-CATALOG-001-v1";

function buildOfflineSupplierProductSyncState(): SupplierProductSyncState {
  const configuration = buildSupplierProductSyncConfiguration();
  return {
    engineVersion: "PILLOW-SPS-001",
    missionId: "R2-05",
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
      lastSynchronizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      synchronizationFailures: 0,
      newProductsDetected: 0,
      updatedProductsDetected: 0,
      discontinuedProductsDetected: 0,
      duplicatesDetected: 0,
      invalidProductsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      synchronizationRuns: 0,
      productsSynchronized: 0,
      newProductsDetected: 0,
      updatedProductsDetected: 0,
      discontinuedProductsDetected: 0,
      duplicatesDetected: 0,
      invalidProductsDetected: 0,
      missingAttributeFindings: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Product Sync snapshot when Pillow session is unavailable. */
export function collectSupplierProductSyncSnapshot() {
  const engine = buildOfflineSupplierProductSyncState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      catalogSize: 0,
      lastSynchronizationAt: null,
      lastDecision: null,
      newProductsDetected: 0,
      updatedProductsDetected: 0,
      discontinuedProductsDetected: 0,
      duplicatesDetected: 0,
      invalidProductsDetected: 0,
      catalogVersion: SUPPLIER_PRODUCT_CATALOG_VERSION,
      recentLogs: [],
    },
    latestReport: null as SupplierProductSyncReport | null,
    catalog: [],
  };
}
