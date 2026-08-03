/** X3-02 — Product Metadata Generator. */

import { WPD_METADATA_VERSION } from "./paths.js";
import type {
  ProductOpportunityRecord,
  ProductRecommendation,
  ProductValidationReport,
  WinningProductDetectorEngineRecord,
  WpdRunReport,
} from "./types.js";

export function buildProductRunReportId(): string {
  return `wpd-run-${Date.now()}`;
}

export class ProductMetadataGenerator {
  buildRunReport(input: {
    action: WpdRunReport["action"];
    engineRecord: WinningProductDetectorEngineRecord;
    productRecords?: ProductOpportunityRecord[];
    recommendations?: ProductRecommendation[];
    validation: ProductValidationReport;
    durationMs: number;
  }): WpdRunReport {
    return {
      productRunReportId: buildProductRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      productRecords: input.productRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WPD_METADATA_VERSION,
    };
  }
}
