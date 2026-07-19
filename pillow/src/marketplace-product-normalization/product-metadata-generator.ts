/** R1-12 — Product metadata generator. */

import { MPN_METADATA_VERSION, UNIFIED_PRODUCT_SCHEMA_VERSION } from "./paths.js";
import type {
  DuplicateProductGroup,
  InvalidProductFinding,
  MissingAttributeFinding,
  NormalizedProductRecord,
  ProductNormalizationReport,
  ProductNormalizationValidationReport,
} from "./types.js";

export function buildNormalizationReportId(): string {
  return `mpn-run-${Date.now()}`;
}

export class ProductMetadataGenerator {
  buildNormalizationReport(input: {
    action: ProductNormalizationReport["action"];
    products: NormalizedProductRecord[];
    duplicates: DuplicateProductGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidProducts: InvalidProductFinding[];
    validation: ProductNormalizationValidationReport;
    durationMs: number;
  }): ProductNormalizationReport {
    return {
      normalizationReportId: buildNormalizationReportId(),
      normalizationTimestamp: new Date().toISOString(),
      action: input.action,
      products: input.products,
      duplicates: input.duplicates,
      missingAttributes: input.missingAttributes,
      invalidProducts: input.invalidProducts,
      validation: input.validation,
      durationMs: input.durationMs,
      schemaVersion: UNIFIED_PRODUCT_SCHEMA_VERSION,
      metadataVersion: MPN_METADATA_VERSION,
    };
  }
}
