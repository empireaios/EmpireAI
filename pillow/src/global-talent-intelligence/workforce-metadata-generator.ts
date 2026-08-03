/** X4-13 — Workforce Metadata Generator. */

import { TAL_METADATA_VERSION } from "./paths.js";
import type {
  GlobalTalentIntelligenceEngineRecord,
  TalRunReport,
  WorkforceRecommendation,
  WorkforceIntelligenceRecord,
  WorkforceValidationReport,
} from "./types.js";

export class WorkforceMetadataGenerator {
  buildRunReport(input: {
    action: TalRunReport["action"];
    engineRecord: GlobalTalentIntelligenceEngineRecord;
    workforceRecords?: WorkforceIntelligenceRecord[];
    recommendations?: WorkforceRecommendation[];
    validation: WorkforceValidationReport;
    durationMs: number;
  }): TalRunReport {
    return {
      workforceRunReportId: `tal-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      workforceRecords: input.workforceRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: TAL_METADATA_VERSION,
    };
  }
}
