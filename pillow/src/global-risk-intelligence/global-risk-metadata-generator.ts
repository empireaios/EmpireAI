/** X4-14 — Regional Metadata Generator. */

import { GRI_METADATA_VERSION } from "./paths.js";
import type {
  GlobalRiskIntelligenceEngineRecord,
  RegionalGrowthRecommendation,
  RegionalOptimizationRecord,
  RegionalValidationReport,
  RgoRunReport,
} from "./types.js";

export class RegionalMetadataGenerator {
  buildRunReport(input: {
    action: RgoRunReport["action"];
    engineRecord: GlobalRiskIntelligenceEngineRecord;
    optimizationRecords?: RegionalOptimizationRecord[];
    recommendations?: RegionalGrowthRecommendation[];
    validation: RegionalValidationReport;
    durationMs: number;
  }): RgoRunReport {
    return {
      regionalRunReportId: `gri-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      optimizationRecords: input.optimizationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GRI_METADATA_VERSION,
    };
  }
}
