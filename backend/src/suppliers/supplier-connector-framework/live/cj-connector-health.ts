import { checkCjHealth, loadCjConfig } from "../../cj-dropshipping/index.js";
import type { SupplierHealth } from "../models/supplier-health.js";
import type { SupplierPlatform } from "../models/supplier-platform.js";
import type { SyncMetadata } from "../models/sync-metadata.js";
import type { SupplierConnector } from "../models/supplier-connector.js";
import type { SupplierConnectorRecordCreateInput } from "../models/supplier-connector-record.js";

function mapHealthState(state: "READY" | "DEGRADED" | "FAILED"): SupplierHealth["healthState"] {
  if (state === "FAILED") {
    return "FAILED";
  }
  return state;
}

/** Builds CJ-specific supplier health from live connector telemetry. */
export async function buildCjSupplierHealth(
  platform: SupplierPlatform,
  credentialsConfigured: boolean,
): Promise<SupplierHealth> {
  if (platform !== "CJ_DROPSHIPPING") {
    throw new Error(`CJ health builder does not support platform ${platform}`);
  }

  const config = loadCjConfig();
  const health = await checkCjHealth(config);

  return {
    healthState: mapHealthState(health.healthState),
    message: health.message,
    credentialsConfigured: credentialsConfigured || health.credentialsConfigured,
    apiReachable: health.apiReachable,
    consecutiveFailures: health.healthState === "FAILED" ? 1 : 0,
    lastCheckedAt: new Date().toISOString(),
    lastSuccessAt: health.lastSuccessfulSync ?? undefined,
    lastFailureAt: health.lastFailureReason ? new Date().toISOString() : undefined,
    lastSuccessfulSync: health.lastSuccessfulSync,
    lastFailureReason: health.lastFailureReason,
  };
}

/** Builds CJ sync metadata for sandbox/live modes. */
export function buildCjSyncMetadata(
  integrationMode: "SANDBOX" | "LIVE",
  recordsSynced = 0,
): SyncMetadata {
  return {
    syncMode: integrationMode,
    orderingEnabled: false,
    lastSyncAttemptAt: new Date().toISOString(),
    lastSuccessfulSyncAt: recordsSynced > 0 ? new Date().toISOString() : null,
    recordsSynced,
    nextScheduledSyncAt: null,
    notes: `CJ Dropshipping ${integrationMode} sync active. No live ordering enabled.`,
  };
}

/** Resolves CJ integration mode from environment configuration. */
export function resolveCjIntegrationMode(): "SANDBOX" | "LIVE" {
  return loadCjConfig().integrationMode;
}

/** Enriches a CJ connector record with live health telemetry and sandbox/live metadata. */
export async function enrichCjConnectorRecord(
  breakdown: SupplierConnectorRecordCreateInput,
  credentialsConfigured = false,
): Promise<SupplierConnectorRecordCreateInput> {
  const config = loadCjConfig();
  const integrationMode = config.integrationMode;
  const health = await buildCjSupplierHealth("CJ_DROPSHIPPING", credentialsConfigured);

  const supplierConnector: SupplierConnector = {
    ...breakdown.supplierConnector,
    integrationMode,
    status: health.credentialsConfigured ? "CONFIGURED" : breakdown.supplierConnector.status,
  };

  return {
    ...breakdown,
    supplierConnector,
    supplierHealth: health,
    syncMetadata: buildCjSyncMetadata(integrationMode, breakdown.syncMetadata.recordsSynced),
  };
}
