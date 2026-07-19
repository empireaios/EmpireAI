/** R2-06 — Inventory metadata generator. */

import { SIS_METADATA_VERSION } from "./paths.js";
import type {
  InventoryChangeFinding,
  InvalidInventoryFinding,
  SupplierInventoryRecord,
  SupplierInventorySyncReport,
  SupplierInventorySyncValidationReport,
} from "./types.js";

export function buildSyncReportId(): string {
  return `sis-run-${Date.now()}`;
}

export class InventoryMetadataGenerator {
  buildSyncReport(input: {
    action: SupplierInventorySyncReport["action"];
    inventory: SupplierInventoryRecord[];
    changes: InventoryChangeFinding[];
    invalidRecords: InvalidInventoryFinding[];
    validation: SupplierInventorySyncValidationReport;
    durationMs: number;
  }): SupplierInventorySyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      inventory: input.inventory,
      changes: input.changes,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SIS_METADATA_VERSION,
    };
  }
}
