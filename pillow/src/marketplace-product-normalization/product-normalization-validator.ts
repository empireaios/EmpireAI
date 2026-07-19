/** R1-12 — Product normalization validator. */

import { MPN_METADATA_VERSION, UNIFIED_PRODUCT_SCHEMA_VERSION } from "./paths.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type {
  DuplicateProductGroup,
  InvalidProductFinding,
  MissingAttributeFinding,
  NormalizedProductRecord,
  ProductNormalizationValidationReport,
} from "./types.js";

export class ProductNormalizationValidator {
  validateNormalizationResult(input: {
    products: NormalizedProductRecord[];
    duplicates: DuplicateProductGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidProducts: InvalidProductFinding[];
    config: MarketplaceProductNormalizationConfiguration;
    baseValidation: ProductNormalizationValidationReport;
  }): ProductNormalizationValidationReport {
    const started = Date.now();
    const errors = [...input.baseValidation.errors];
    const warnings = [...input.baseValidation.warnings];

    if (input.invalidProducts.length > 0) {
      for (const invalid of input.invalidProducts) {
        warnings.push(
          `Skipped invalid raw product ${invalid.marketplaceIdentifier}/${invalid.marketplaceProductId}: ${invalid.errors.join("; ")}`,
        );
      }
    }

    if (input.duplicates.length > 0 && input.config.duplicateDetectionRulesEnabled) {
      warnings.push(`${input.duplicates.length} duplicate product group(s) detected`);
    }

    if (input.missingAttributes.length > 0) {
      warnings.push(`${input.missingAttributes.length} product(s) with missing attributes`);
    }

    for (const product of input.products) {
      if (product.schemaVersion !== UNIFIED_PRODUCT_SCHEMA_VERSION) {
        errors.push(`${product.productId}: invalid schema version`);
      }
      if (product.metadataVersion !== MPN_METADATA_VERSION) {
        warnings.push(`${product.productId}: metadata version mismatch`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : input.baseValidation.decision;

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
}
