/** X2-03 — Portfolio performance metadata generator. */

import { PPE_METADATA_VERSION } from "./paths.js";
import type {
  PerformanceEngineRecord,
  PerformanceRecommendation,
  PerformanceRunReport,
  PerformanceValidationReport,
  PortfolioKpiSnapshot,
  PortfolioPerformanceRecord,
} from "./types.js";

export function buildPerformanceRunReportId(): string {
  return `ppe-run-${Date.now()}`;
}

export class PortfolioPerformanceMetadataGenerator {
  buildRunReport(input: {
    action: PerformanceRunReport["action"];
    engineRecord: PerformanceEngineRecord;
    performanceRecords: PortfolioPerformanceRecord[];
    kpiSnapshot?: PortfolioKpiSnapshot | null;
    recommendations?: PerformanceRecommendation[];
    validation: PerformanceValidationReport;
    durationMs: number;
  }): PerformanceRunReport {
    return {
      performanceRunReportId: buildPerformanceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      performanceRecords: input.performanceRecords,
      kpiSnapshot: input.kpiSnapshot ?? null,
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PPE_METADATA_VERSION,
    };
  }
}
