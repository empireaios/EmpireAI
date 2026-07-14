/** R1-03 — Amazon product validator. */

import { AMAZON_PRODUCT_METADATA_VERSION } from "./paths.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type { AmazonProductRecord, AmazonProductValidationReport } from "./types.js";

export class AmazonProductValidator {
  validateConfiguration(
    config: AmazonProductIntelligenceConfiguration,
  ): AmazonProductValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.syncFrequencyMinutes < 1) {
      warnings.push("Sync frequency below 1 minute may cause excessive API calls");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Product validation rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzprod-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
    };
  }

  validateProduct(record: AmazonProductRecord): AmazonProductValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.productId.startsWith("amzprod-")) errors.push("Invalid product ID prefix");
    if (!record.amazonAsin) errors.push("Missing Amazon ASIN");
    if (!record.productTitle?.trim()) errors.push("Missing product title");
    if (record.marketplaceId !== "amazon") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.sourceApiReference) warnings.push("Missing source API reference");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzprod-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
    };
  }

  validateCatalog(
    products: AmazonProductRecord[],
    config: AmazonProductIntelligenceConfiguration,
  ): AmazonProductValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `amzprod-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
      };
    }

    const asins = new Set<string>();
    for (const product of products) {
      const result = this.validateProduct(product);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${product.amazonAsin}: ${e}`));
      }
      if (asins.has(product.amazonAsin)) {
        errors.push(`Duplicate ASIN: ${product.amazonAsin}`);
      }
      asins.add(product.amazonAsin);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzprod-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
    };
  }
}
