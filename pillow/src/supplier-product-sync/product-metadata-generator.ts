/** R2-05 — Product metadata generator. */

import { SPS_METADATA_VERSION, SUPPLIER_PRODUCT_CATALOG_VERSION } from "./paths.js";
import type {
  DuplicateProductGroup,
  InvalidProductFinding,
  MissingAttributeFinding,
  ProductChangeFinding,
  SupplierProductRecord,
  SupplierProductSyncReport,
  SupplierProductSyncValidationReport,
} from "./types.js";

export function buildSyncReportId(): string {
  return `sps-run-${Date.now()}`;
}

export class ProductMetadataGenerator {
  buildSyncReport(input: {
    action: SupplierProductSyncReport["action"];
    products: SupplierProductRecord[];
    changes: ProductChangeFinding[];
    duplicates: DuplicateProductGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidProducts: InvalidProductFinding[];
    validation: SupplierProductSyncValidationReport;
    durationMs: number;
  }): SupplierProductSyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      products: input.products,
      changes: input.changes,
      duplicates: input.duplicates,
      missingAttributes: input.missingAttributes,
      invalidProducts: input.invalidProducts,
      validation: input.validation,
      durationMs: input.durationMs,
      catalogVersion: SUPPLIER_PRODUCT_CATALOG_VERSION,
      metadataVersion: SPS_METADATA_VERSION,
    };
  }
}
