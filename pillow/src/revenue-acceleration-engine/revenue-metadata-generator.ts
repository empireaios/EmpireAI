/** X3-16 — Revenue Metadata Generator. */

import { RAE_METADATA_VERSION } from "./paths.js";
import type {
  RevenueAccelerationRecommendation,
  RevenueAccelerationEngineRecord,
  RevenueAccelerationRecord,
  RevenueValidationReport,
  RaeRunReport,
} from "./types.js";

export function buildRevenueAccelerationEngineRunReportId(): string {
  return `rae-run-${Date.now()}`;
}

export class RevenueMetadataGenerator {
  buildRunReport(input: {
    action: RaeRunReport["action"];
    engineRecord: RevenueAccelerationEngineRecord;
    revenueAccelerationRecords?: RevenueAccelerationRecord[];
    recommendations?: RevenueAccelerationRecommendation[];
    validation: RevenueValidationReport;
    durationMs: number;
  }): RaeRunReport {
    return {
      revenueAccelerationEngineRunReportId: buildRevenueAccelerationEngineRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      revenueAccelerationRecords: input.revenueAccelerationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RAE_METADATA_VERSION,
    };
  }
}
