/** X2-15 — Acquisition Metadata Generator. */

import { AEE_METADATA_VERSION } from "./paths.js";
import type {
  AcquisitionEvaluationEngineRecord,
  AcquisitionRecommendation,
  AcquisitionRecord,
  AcquisitionRunReport,
  AcquisitionValidationReport,
} from "./types.js";

export function buildAcquisitionRunReportId(): string {
  return `aee-run-${Date.now()}`;
}

export class AcquisitionMetadataGenerator {
  buildRunReport(input: {
    action: AcquisitionRunReport["action"];
    engineRecord: AcquisitionEvaluationEngineRecord;
    acquisitionRecords?: AcquisitionRecord[];
    recommendations?: AcquisitionRecommendation[];
    validation: AcquisitionValidationReport;
    durationMs: number;
  }): AcquisitionRunReport {
    return {
      acquisitionRunReportId: buildAcquisitionRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      acquisitionRecords: input.acquisitionRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AEE_METADATA_VERSION,
    };
  }
}
