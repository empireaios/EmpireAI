/** X2-07 — Risk metadata generator. */

import { PRE_METADATA_VERSION } from "./paths.js";
import type {
  PortfolioRiskRecord,
  PortfolioRiskScoreSummary,
  RiskEngineRecord,
  RiskRecommendation,
  RiskRunReport,
  RiskValidationReport,
} from "./types.js";

export function buildRiskRunReportId(): string {
  return `pre-run-${Date.now()}`;
}

export class RiskMetadataGenerator {
  buildRunReport(input: {
    action: RiskRunReport["action"];
    engineRecord: RiskEngineRecord;
    riskRecords: PortfolioRiskRecord[];
    recommendations: RiskRecommendation[];
    scoreSummary: PortfolioRiskScoreSummary | null;
    validation: RiskValidationReport;
    durationMs: number;
  }): RiskRunReport {
    return {
      riskRunReportId: buildRiskRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      riskRecords: input.riskRecords,
      recommendations: input.recommendations,
      scoreSummary: input.scoreSummary,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PRE_METADATA_VERSION,
    };
  }
}
