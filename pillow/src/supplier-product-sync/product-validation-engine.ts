/** R2-05 — Product validation engine. */

import { SPS_METADATA_VERSION } from "./paths.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  InvalidProductFinding,
  MissingAttributeFinding,
  RawSupplierProductPayload,
  SupplierProductRecord,
  SupplierProductSyncValidationReport,
} from "./types.js";
import { SupplierCatalogEngine } from "./supplier-catalog-engine.js";

export class ProductValidationEngine {
  private readonly catalogEngine = new SupplierCatalogEngine();

  validateConfiguration(
    config: SupplierProductSyncConfiguration,
  ): SupplierProductSyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.productMappingRulesEnabled) warnings.push("Product mapping rules disabled");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sps-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SPS_METADATA_VERSION,
    };
  }

  validateProduct(record: SupplierProductRecord): SupplierProductSyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.productId.startsWith("sps-")) errors.push("Invalid product ID prefix");
    if (!record.supplierProductId) errors.push("Missing supplier product ID");
    if (!record.productTitle?.trim()) errors.push("Missing product title");
    if (!this.catalogEngine.isSupportedSupplier(record.supplierId)) {
      errors.push(`Unsupported supplier: ${record.supplierId}`);
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.supplierMetadata || Object.keys(record.supplierMetadata).length === 0) {
      warnings.push("Missing supplier metadata");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sps-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SPS_METADATA_VERSION,
    };
  }

  validateCatalog(
    products: SupplierProductRecord[],
    config: SupplierProductSyncConfiguration,
  ): SupplierProductSyncValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `sps-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: SPS_METADATA_VERSION,
      };
    }

    const ids = new Set<string>();
    for (const product of products) {
      const result = this.validateProduct(product);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${product.productId}: ${e}`));
      }
      if (ids.has(product.productId)) {
        errors.push(`Duplicate product ID: ${product.productId}`);
      }
      ids.add(product.productId);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sps-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SPS_METADATA_VERSION,
    };
  }

  detectMissingAttributes(
    products: SupplierProductRecord[],
    config: SupplierProductSyncConfiguration,
  ): MissingAttributeFinding[] {
    if (!config.validationRulesEnabled) return [];

    const findings: MissingAttributeFinding[] = [];
    const optionalRequired = ["sku", "productCategory", "productDescription"];

    for (const product of products) {
      const missing = optionalRequired.filter((field) => {
        const value = product[field as keyof SupplierProductRecord];
        return value == null || (typeof value === "string" && !value.trim());
      });
      if (missing.length > 0) {
        findings.push({
          productId: product.productId,
          supplierId: product.supplierId,
          missingFields: missing,
        });
      }
    }

    return findings;
  }

  detectInvalidRawProducts(payloads: RawSupplierProductPayload[]): InvalidProductFinding[] {
    const findings: InvalidProductFinding[] = [];

    for (const payload of payloads) {
      const errors: string[] = [];
      if (!payload.supplierProductId?.trim()) errors.push("Missing supplier product ID");
      if (!this.catalogEngine.isSupportedSupplier(payload.supplierId)) {
        errors.push(`Unsupported supplier: ${payload.supplierId}`);
      }
      const title =
        payload.sourceData.title ?? payload.sourceData.name ?? payload.sourceData.product_name;
      if (!title) errors.push("Missing product title in source data");

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
