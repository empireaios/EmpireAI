/** X2-20 — Executive Metadata Generator. */

import { APB_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousPortfolioBoardEngineRecord,
  ExecutiveBoardRecord,
  ExecutiveBoardRunReport,
  ExecutiveRecommendation,
  ExecutiveValidationReport,
} from "./types.js";

export function buildExecutiveBoardRunReportId(): string {
  return `apb-run-${Date.now()}`;
}

export class ExecutiveMetadataGenerator {
  buildRunReport(input: {
    action: ExecutiveBoardRunReport["action"];
    engineRecord: AutonomousPortfolioBoardEngineRecord;
    boardRecords?: ExecutiveBoardRecord[];
    recommendations?: ExecutiveRecommendation[];
    validation: ExecutiveValidationReport;
    durationMs: number;
  }): ExecutiveBoardRunReport {
    return {
      executiveBoardRunReportId: buildExecutiveBoardRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      boardRecords: input.boardRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: APB_METADATA_VERSION,
    };
  }
}
