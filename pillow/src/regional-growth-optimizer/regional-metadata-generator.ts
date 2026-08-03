/** X4-14 — Regional Metadata Generator. */

import { RGO_METADATA_VERSION } from "./paths.js";
import type {
  RegionalGrowthOptimizerEngineRecord,
  RegionalGrowthRecommendation,
  RegionalOptimizationRecord,
  RegionalValidationReport,
  RgoRunReport,
} from "./types.js";

export class RegionalMetadataGenerator {
  buildRunReport(input: {
    action: RgoRunReport["action"];
    engineRecord: RegionalGrowthOptimizerEngineRecord;
    optimizationRecords?: RegionalOptimizationRecord[];
    recommendations?: RegionalGrowthRecommendation[];
    validation: RegionalValidationReport;
    durationMs: number;
  }): RgoRunReport {
    return {
      regionalRunReportId: `rgo-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      optimizationRecords: input.optimizationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RGO_METADATA_VERSION,
    };
  }
}
