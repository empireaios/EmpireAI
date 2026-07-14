/** R1-05 — Amazon inventory metadata generator. */

import { AMAZON_INVENTORY_METADATA_VERSION } from "./paths.js";
import type {
  AmazonInventoryChangeSet,
  AmazonInventoryRecord,
  AmazonInventorySyncReport,
  AmazonInventoryValidationReport,
} from "./types.js";

export function buildSyncReportId(): string {
  return `amzinv-sync-${Date.now()}`;
}

export class AmazonInventoryMetadataGenerator {
  buildSyncReport(input: {
    action: AmazonInventorySyncReport["action"];
    inventory: AmazonInventoryRecord[];
    changes: AmazonInventoryChangeSet;
    validation: AmazonInventoryValidationReport;
    durationMs: number;
  }): AmazonInventorySyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      inventory: input.inventory,
      changes: input.changes,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
    };
  }
}
