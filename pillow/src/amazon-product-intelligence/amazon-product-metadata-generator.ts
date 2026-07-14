/** R1-03 — Amazon product metadata generator. */

import { AMAZON_PRODUCT_METADATA_VERSION } from "./paths.js";
import type {
  AmazonProductChangeSet,
  AmazonProductRecord,
  AmazonProductSyncReport,
  AmazonProductValidationReport,
} from "./types.js";

export function buildSyncReportId(): string {
  return `amzprod-sync-${Date.now()}`;
}

export class AmazonProductMetadataGenerator {
  buildSyncReport(input: {
    action: AmazonProductSyncReport["action"];
    products: AmazonProductRecord[];
    changes: AmazonProductChangeSet;
    validation: AmazonProductValidationReport;
    durationMs: number;
  }): AmazonProductSyncReport {
    return {
      syncReportId: buildSyncReportId(),
      syncTimestamp: new Date().toISOString(),
      action: input.action,
      products: input.products,
      changes: input.changes,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
    };
  }
}
