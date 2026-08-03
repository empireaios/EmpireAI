/** X3-06 — Supplier Metadata Generator. */

import { SSE_METADATA_VERSION } from "./paths.js";
import type {
  SupplierRecommendation,
  SupplierScaleEngineRecord,
  SupplierScalingRecord,
  SupplierValidationReport,
  SseRunReport,
} from "./types.js";

export function buildSupplierScaleRunReportId(): string {
  return `sse-run-${Date.now()}`;
}

export class SupplierMetadataGenerator {
  buildRunReport(input: {
    action: SseRunReport["action"];
    engineRecord: SupplierScaleEngineRecord;
    scalingRecords?: SupplierScalingRecord[];
    recommendations?: SupplierRecommendation[];
    validation: SupplierValidationReport;
    durationMs: number;
  }): SseRunReport {
    return {
      supplierScaleRunReportId: buildSupplierScaleRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      scalingRecords: input.scalingRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SSE_METADATA_VERSION,
    };
  }
}
