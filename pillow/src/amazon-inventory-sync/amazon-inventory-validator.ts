/** R1-05 — Amazon inventory validator. */

import { AMAZON_INVENTORY_METADATA_VERSION } from "./paths.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type { AmazonInventoryRecord, AmazonInventoryValidationReport } from "./types.js";

export class AmazonInventoryValidator {
  validateConfiguration(
    config: AmazonInventorySyncConfiguration,
  ): AmazonInventoryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.lowStockThreshold < 0) errors.push("Low-stock threshold cannot be negative");
    if (!config.validationRulesEnabled) warnings.push("Inventory validation rules disabled");
    if (config.allowStockPush) warnings.push("Stock push enabled — requires approved workflow");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzinv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
    };
  }

  validateRecord(record: AmazonInventoryRecord): AmazonInventoryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.inventoryId.startsWith("amzinv-")) errors.push("Invalid inventory ID prefix");
    if (!record.amazonSku) errors.push("Missing Amazon SKU");
    if (record.marketplaceId !== "amazon") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.availableQuantity < 0) errors.push("Negative available quantity");
    if (!record.sourceApiReference) warnings.push("Missing source API reference");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzinv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
    };
  }

  validateInventory(
    inventory: AmazonInventoryRecord[],
    config: AmazonInventorySyncConfiguration,
  ): AmazonInventoryValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `amzinv-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
      };
    }

    const skus = new Set<string>();
    for (const record of inventory) {
      const result = this.validateRecord(record);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${record.amazonSku}: ${e}`));
      }
      if (skus.has(record.amazonSku)) errors.push(`Duplicate SKU: ${record.amazonSku}`);
      skus.add(record.amazonSku);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzinv-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
    };
  }
}
