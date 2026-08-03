/** X2-09 — Business Health Metadata Generator. */

import { BHR_METADATA_VERSION } from "./paths.js";
import type {
  BusinessHealthRecord,
  BusinessHealthRunReport,
  BusinessHealthValidationReport,
  ManagementPriorityRecommendation,
  RankingEngineRecord,
} from "./types.js";

export class BusinessHealthMetadataGenerator {
  buildRunReport(input: {
    action: BusinessHealthRunReport["action"];
    engineRecord: RankingEngineRecord;
    healthRecords: BusinessHealthRecord[];
    recommendations: ManagementPriorityRecommendation[];
    validation: BusinessHealthValidationReport;
    durationMs: number;
  }): BusinessHealthRunReport {
    return {
      rankingRunReportId: `bhr-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      healthRecords: input.healthRecords,
      recommendations: input.recommendations,
      validation: {
        ...input.validation,
        metadataVersion: BHR_METADATA_VERSION,
      },
      durationMs: input.durationMs,
      metadataVersion: BHR_METADATA_VERSION,
    };
  }
}
