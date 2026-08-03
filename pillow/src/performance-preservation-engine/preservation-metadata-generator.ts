/** X3-12 — Preservation Metadata Generator. */

import { PPE_METADATA_VERSION } from "./paths.js";
import type {
  PreservationRecommendation,
  PerformancePreservationEngineRecord,
  PreservationRecord,
  PreservationValidationReport,
  PpeRunReport,
} from "./types.js";

export function buildPerformancePreservationEngineRunReportId(): string {
  return `ppe-run-${Date.now()}`;
}

export class PreservationMetadataGenerator {
  buildRunReport(input: {
    action: PpeRunReport["action"];
    engineRecord: PerformancePreservationEngineRecord;
    preservationRecords?: PreservationRecord[];
    recommendations?: PreservationRecommendation[];
    validation: PreservationValidationReport;
    durationMs: number;
  }): PpeRunReport {
    return {
      performancePreservationEngineRunReportId: buildPerformancePreservationEngineRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      preservationRecords: input.preservationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PPE_METADATA_VERSION,
    };
  }
}
