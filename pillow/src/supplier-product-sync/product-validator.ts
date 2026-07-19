/** R2-05 — Product validator. */

import { SPS_METADATA_VERSION } from "./paths.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  DuplicateProductGroup,
  InvalidProductFinding,
  MissingAttributeFinding,
  ProductChangeFinding,
  SupplierProductRecord,
  SupplierProductSyncValidationReport,
} from "./types.js";

export class ProductValidator {
  validateSyncResult(input: {
    products: SupplierProductRecord[];
    changes: ProductChangeFinding[];
    duplicates: DuplicateProductGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidProducts: InvalidProductFinding[];
    config: SupplierProductSyncConfiguration;
    baseValidation: SupplierProductSyncValidationReport;
  }): SupplierProductSyncValidationReport {
    const started = Date.now();
    const errors = [...input.baseValidation.errors];
    const warnings = [...input.baseValidation.warnings];

    if (input.invalidProducts.length > 0) {
      for (const invalid of input.invalidProducts) {
        warnings.push(
          `Skipped invalid raw product ${invalid.supplierId}/${invalid.supplierProductId}: ${invalid.errors.join("; ")}`,
        );
      }
    }

    if (input.duplicates.length > 0 && input.config.duplicateDetectionRulesEnabled) {
      warnings.push(`${input.duplicates.length} duplicate product group(s) detected`);
    }

    if (input.changes.length > 0 && input.config.changeDetectionRulesEnabled) {
      warnings.push(`${input.changes.length} product change(s) detected`);
    }

    if (input.missingAttributes.length > 0) {
      warnings.push(`${input.missingAttributes.length} product(s) with missing attributes`);
    }

    for (const product of input.products) {
      if (product.metadataVersion !== SPS_METADATA_VERSION) {
        warnings.push(`${product.productId}: metadata version mismatch`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : input.baseValidation.decision;

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
}
