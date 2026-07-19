/** R2-07 — Pricing Validation Engine. */

import type {
  InvalidPricingFinding,
  RawSupplierPricingPayload,
  SupplierPricingRecord,
} from "./types.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export class PricingValidationEngine {
  detectInvalidRawPricing(rawPricing: RawSupplierPricingPayload[]): InvalidPricingFinding[] {
    const findings: InvalidPricingFinding[] = [];

    for (const raw of rawPricing) {
      const errors: string[] = [];
      if (!raw.supplierId) errors.push("Missing supplierId");
      if (!raw.supplierProductId) errors.push("Missing supplierProductId");
      if (!(SUPPORTED_SUPPLIER_IDENTIFIERS as readonly string[]).includes(raw.supplierId)) {
        errors.push(`Unsupported supplier: ${raw.supplierId}`);
      }
      if (!Number.isFinite(raw.price) || raw.price < 0) {
        errors.push("Invalid price: must be a non-negative number");
      }
      if (errors.length) {
        findings.push({
          supplierId: raw.supplierId ?? "unknown",
          supplierProductId: raw.supplierProductId ?? "unknown",
          errors,
        });
      }
    }

    return findings;
  }

  validatePricing(
    pricing: SupplierPricingRecord[],
    config: SupplierPricingEngineConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.priceValidationRulesEnabled) {
      return { errors, warnings };
    }

    const seen = new Set<string>();
    for (const record of pricing) {
      const key = `${record.supplierId}:${record.supplierProductId}`;
      if (seen.has(key)) {
        errors.push(`Duplicate pricing record: ${key}`);
      }
      seen.add(key);

      if (!record.pricingRecordId.startsWith("spe-")) {
        errors.push(`Invalid pricing record ID prefix: ${record.pricingRecordId}`);
      }
      if (record.currentSupplierPrice < 0) {
        errors.push(`Negative price for ${key}`);
      }
      if (
        record.priceChangePercentage !== null &&
        Math.abs(record.priceChangePercentage) >= config.priceAnomalyThresholdPercent
      ) {
        warnings.push(`Anomaly threshold exceeded for ${key}: ${record.priceChangePercentage.toFixed(1)}%`);
      }
    }

    return { errors, warnings };
  }
}
