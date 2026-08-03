/** X2-17 — Lifecycle Metadata Generator. */

import { CLM_METADATA_VERSION } from "./paths.js";
import type {
  CompanyLifecycleEngineRecord,
  LifecycleRecommendation,
  LifecycleRecord,
  LifecycleRunReport,
  LifecycleValidationReport,
} from "./types.js";

export function buildLifecycleRunReportId(): string {
  return `clm-run-${Date.now()}`;
}

export class LifecycleMetadataGenerator {
  buildRunReport(input: {
    action: LifecycleRunReport["action"];
    engineRecord: CompanyLifecycleEngineRecord;
    lifecycleRecords?: LifecycleRecord[];
    recommendations?: LifecycleRecommendation[];
    validation: LifecycleValidationReport;
    durationMs: number;
  }): LifecycleRunReport {
    return {
      lifecycleRunReportId: buildLifecycleRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      lifecycleRecords: input.lifecycleRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CLM_METADATA_VERSION,
    };
  }
}
