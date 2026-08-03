/** X2-16 — Optimization Metadata Generator. */

import { POE_METADATA_VERSION } from "./paths.js";
import type {
  OptimizationRecommendation,
  OptimizationRecord,
  OptimizationRunReport,
  OptimizationValidationReport,
  PortfolioOptimizationEngineRecord,
} from "./types.js";

export function buildOptimizationRunReportId(): string {
  return `poe-run-${Date.now()}`;
}

export class OptimizationMetadataGenerator {
  buildRunReport(input: {
    action: OptimizationRunReport["action"];
    engineRecord: PortfolioOptimizationEngineRecord;
    optimizationRecords?: OptimizationRecord[];
    recommendations?: OptimizationRecommendation[];
    validation: OptimizationValidationReport;
    durationMs: number;
  }): OptimizationRunReport {
    return {
      optimizationRunReportId: buildOptimizationRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      optimizationRecords: input.optimizationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: POE_METADATA_VERSION,
    };
  }
}
