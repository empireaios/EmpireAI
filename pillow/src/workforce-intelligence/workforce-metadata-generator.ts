/** X3-08 — Workforce Metadata Generator. */

import { WFI_METADATA_VERSION } from "./paths.js";
import type {
  WorkforceRecommendation,
  WorkforceIntelligenceEngineRecord,
  WorkforceRecord,
  WorkforceValidationReport,
  WfiRunReport,
} from "./types.js";

export function buildWorkforceIntelligenceRunReportId(): string {
  return `wfi-run-${Date.now()}`;
}

export class WorkforceMetadataGenerator {
  buildRunReport(input: {
    action: WfiRunReport["action"];
    engineRecord: WorkforceIntelligenceEngineRecord;
    workforceRecords?: WorkforceRecord[];
    recommendations?: WorkforceRecommendation[];
    validation: WorkforceValidationReport;
    durationMs: number;
  }): WfiRunReport {
    return {
      workforceIntelligenceRunReportId: buildWorkforceIntelligenceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      workforceRecords: input.workforceRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WFI_METADATA_VERSION,
    };
  }
}
