/** R1-12 — Product validation engine. */

import { MPN_METADATA_VERSION } from "./paths.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type {
  InvalidProductFinding,
  MissingAttributeFinding,
  NormalizedProductRecord,
  ProductNormalizationValidationReport,
  RawMarketplaceProductPayload,
} from "./types.js";
import { ProductAttributeMapper } from "./product-attribute-mapper.js";
import { UnifiedProductSchemaEngine } from "./unified-product-schema-engine.js";

const REQUIRED_FIELDS = ["productTitle", "marketplaceProductId"];

export class ProductValidationEngine {
  private readonly attributeMapper = new ProductAttributeMapper();
  private readonly schemaEngine = new UnifiedProductSchemaEngine();

  validateConfiguration(
    config: MarketplaceProductNormalizationConfiguration,
  ): ProductNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled");
    }
    if (!config.productSchemaRulesEnabled) {
      warnings.push("Product schema rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mpn-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MPN_METADATA_VERSION,
    };
  }

  validateProduct(record: NormalizedProductRecord): ProductNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.productId.startsWith("mpn-")) errors.push("Invalid product ID prefix");
    if (!record.marketplaceProductId) errors.push("Missing marketplace product ID");
    if (!record.productTitle?.trim()) errors.push("Missing product title");
    if (!this.schemaEngine.isSupportedMarketplace(record.marketplaceIdentifier)) {
      errors.push(`Unsupported marketplace: ${record.marketplaceIdentifier}`);
    }
    if (!record.schemaVersion) errors.push("Missing schema version");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.marketplaceMetadata || Object.keys(record.marketplaceMetadata).length === 0) {
      warnings.push("Missing marketplace metadata");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mpn-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MPN_METADATA_VERSION,
    };
  }

  validateCatalog(
    products: NormalizedProductRecord[],
    config: MarketplaceProductNormalizationConfiguration,
  ): ProductNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `mpn-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: MPN_METADATA_VERSION,
      };
    }

    const ids = new Set<string>();
    for (const product of products) {
      const result = this.validateProduct(product);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${product.productId}: ${e}`));
      }
      if (ids.has(product.productId)) {
        errors.push(`Duplicate normalized product ID: ${product.productId}`);
      }
      ids.add(product.productId);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mpn-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MPN_METADATA_VERSION,
    };
  }

  detectMissingAttributes(
    products: NormalizedProductRecord[],
    config: MarketplaceProductNormalizationConfiguration,
  ): MissingAttributeFinding[] {
    if (!config.validationRulesEnabled) return [];

    const findings: MissingAttributeFinding[] = [];
    const optionalRequired = ["sku", "productCategory", "productBrand"];

    for (const product of products) {
      const missing = this.attributeMapper.detectMissingFields(product, [
        ...REQUIRED_FIELDS,
        ...optionalRequired,
      ]);
      if (missing.length > 0) {
        findings.push({
          productId: product.productId,
          marketplaceIdentifier: product.marketplaceIdentifier,
          missingFields: missing,
        });
      }
    }

    return findings;
  }

  detectInvalidRawProducts(
    payloads: RawMarketplaceProductPayload[],
  ): InvalidProductFinding[] {
    const findings: InvalidProductFinding[] = [];

    for (const payload of payloads) {
      const errors: string[] = [];
      if (!payload.marketplaceProductId?.trim()) errors.push("Missing marketplace product ID");
      if (!this.schemaEngine.isSupportedMarketplace(payload.marketplaceIdentifier)) {
        errors.push(`Unsupported marketplace: ${payload.marketplaceIdentifier}`);
      }
      const title =
        payload.sourceData.title ??
        payload.sourceData.name ??
        payload.sourceData.productName ??
        payload.sourceData.product_name;
      if (!title) errors.push("Missing product title in source data");

      if (errors.length > 0) {
        findings.push({
          marketplaceIdentifier: payload.marketplaceIdentifier,
          marketplaceProductId: payload.marketplaceProductId,
          errors,
        });
      }
    }

    return findings;
  }
}
