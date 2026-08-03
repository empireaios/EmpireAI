/** X3-15 — Growth Metadata Generator. */

import { AGO_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousGrowthRecommendation,
  AutonomousGrowthOptimizerRecord,
  GrowthOptimizationRecord,
  GrowthValidationReport,
  AgoRunReport,
} from "./types.js";

export function buildAutonomousGrowthOptimizerRunReportId(): string {
  return `ago-run-${Date.now()}`;
}

export class GrowthMetadataGenerator {
  buildRunReport(input: {
    action: AgoRunReport["action"];
    engineRecord: AutonomousGrowthOptimizerRecord;
    growthOptimizationRecords?: GrowthOptimizationRecord[];
    recommendations?: AutonomousGrowthRecommendation[];
    validation: GrowthValidationReport;
    durationMs: number;
  }): AgoRunReport {
    return {
      autonomousGrowthOptimizerRunReportId: buildAutonomousGrowthOptimizerRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      growthOptimizationRecords: input.growthOptimizationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AGO_METADATA_VERSION,
    };
  }
}
