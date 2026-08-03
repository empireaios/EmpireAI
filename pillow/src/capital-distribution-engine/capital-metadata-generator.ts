/** X2-05 — Capital metadata generator. */

import { CDE_METADATA_VERSION } from "./paths.js";
import type {
  CapitalAllocationRecord,
  CapitalEngineRecord,
  CapitalPoolRecord,
  CapitalRecommendation,
  CapitalRiskSignal,
  CapitalRunReport,
  CapitalValidationReport,
} from "./types.js";

export function buildCapitalRunReportId(): string {
  return `cde-run-${Date.now()}`;
}

export class CapitalMetadataGenerator {
  buildRunReport(input: {
    action: CapitalRunReport["action"];
    engineRecord: CapitalEngineRecord;
    poolRecords?: CapitalPoolRecord[];
    allocationRecords?: CapitalAllocationRecord[];
    riskSignals?: CapitalRiskSignal[];
    recommendations?: CapitalRecommendation[];
    validation: CapitalValidationReport;
    durationMs: number;
  }): CapitalRunReport {
    return {
      capitalRunReportId: buildCapitalRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      poolRecords: input.poolRecords ?? [],
      allocationRecords: input.allocationRecords ?? [],
      riskSignals: input.riskSignals ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CDE_METADATA_VERSION,
    };
  }
}
