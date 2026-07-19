/** R2-06 — Inventory validator. */

import { SIS_METADATA_VERSION } from "./paths.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  InventoryChangeFinding,
  InvalidInventoryFinding,
  SupplierInventoryRecord,
  SupplierInventorySyncValidationReport,
} from "./types.js";

export class InventoryValidator {
  validateSyncResult(input: {
    inventory: SupplierInventoryRecord[];
    changes: InventoryChangeFinding[];
    invalidRecords: InvalidInventoryFinding[];
    config: SupplierInventorySyncConfiguration;
    baseValidation: SupplierInventorySyncValidationReport;
  }): SupplierInventorySyncValidationReport {
    const started = Date.now();
    const errors = [...input.baseValidation.errors];
    const warnings = [...input.baseValidation.warnings];

    if (input.invalidRecords.length > 0) {
      for (const invalid of input.invalidRecords) {
        warnings.push(
          `Skipped invalid inventory ${invalid.supplierId}/${invalid.supplierProductId}: ${invalid.errors.join("; ")}`,
        );
      }
    }

    if (input.changes.length > 0 && input.config.changeDetectionRulesEnabled) {
      warnings.push(`${input.changes.length} inventory change(s) detected`);
    }

    for (const record of input.inventory) {
      if (record.metadataVersion !== SIS_METADATA_VERSION) {
        warnings.push(`${record.inventoryRecordId}: metadata version mismatch`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : input.baseValidation.decision;

    return {
      validationReportId: `sis-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SIS_METADATA_VERSION,
    };
  }
}
