/** R2-06 — Stock validation engine. */

import { SIS_METADATA_VERSION } from "./paths.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  InvalidInventoryFinding,
  RawSupplierInventoryPayload,
  SupplierInventoryRecord,
  SupplierInventorySyncValidationReport,
} from "./types.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export class StockValidationEngine {
  validateConfiguration(
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventorySyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.stockValidationRulesEnabled) warnings.push("Stock validation rules disabled");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  validateRecord(record: SupplierInventoryRecord): SupplierInventorySyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.inventoryRecordId.startsWith("sis-")) errors.push("Invalid inventory record ID prefix");
    if (!record.supplierProductId) errors.push("Missing supplier product ID");
    if (!SUPPORTED_SUPPLIER_IDENTIFIERS.includes(record.supplierId as (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number])) {
      errors.push(`Unsupported supplier: ${record.supplierId}`);
    }
    if (record.currentStockQuantity < 0) errors.push("Negative stock quantity");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.internalProductId) warnings.push("Missing internal product ID mapping");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  validateInventory(
    inventory: SupplierInventoryRecord[],
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventorySyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `sis-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: SIS_METADATA_VERSION,
      };
    }

    const ids = new Set<string>();
    for (const record of inventory) {
      const result = this.validateRecord(record);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${record.inventoryRecordId}: ${e}`));
      }
      if (ids.has(record.inventoryRecordId)) {
        errors.push(`Duplicate inventory record ID: ${record.inventoryRecordId}`);
      }
      ids.add(record.inventoryRecordId);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  detectInvalidRawInventory(payloads: RawSupplierInventoryPayload[]): InvalidInventoryFinding[] {
    const findings: InvalidInventoryFinding[] = [];

    for (const payload of payloads) {
      const errors: string[] = [];
      if (!payload.supplierProductId?.trim()) errors.push("Missing supplier product ID");
      if (!SUPPORTED_SUPPLIER_IDENTIFIERS.includes(payload.supplierId as (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number])) {
        errors.push(`Unsupported supplier: ${payload.supplierId}`);
      }
      if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
        errors.push("Invalid stock quantity");
      }

      if (errors.length > 0) {
        findings.push({
          supplierId: payload.supplierId,
          supplierProductId: payload.supplierProductId,
          errors,
        });
      }
    }

    return findings;
  }
}
