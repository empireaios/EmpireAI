/** X2-08 — Portfolio balance metadata generator. */

import { PBE_METADATA_VERSION } from "./paths.js";
import type {
  BalanceEngineRecord,
  BalanceRecommendation,
  BalanceRunReport,
  BalanceValidationReport,
  PortfolioBalanceRecord,
} from "./types.js";

export function buildBalanceRunReportId(): string {
  return `pbe-run-${Date.now()}`;
}

export class PortfolioBalanceMetadataGenerator {
  buildRunReport(input: {
    action: BalanceRunReport["action"];
    engineRecord: BalanceEngineRecord;
    balanceRecords: PortfolioBalanceRecord[];
    recommendations: BalanceRecommendation[];
    validation: BalanceValidationReport;
    durationMs: number;
  }): BalanceRunReport {
    return {
      balanceRunReportId: buildBalanceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      balanceRecords: input.balanceRecords,
      recommendations: input.recommendations,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PBE_METADATA_VERSION,
    };
  }
}
