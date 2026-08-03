/** X2-19 — Valuation Metadata Generator. */

import { EVE_METADATA_VERSION } from "./paths.js";
import type {
  EnterpriseValueEngineRecord,
  ValuationAnomaly,
  ValuationHistoryEntry,
  ValuationRecommendation,
  ValuationRecord,
  ValuationRunReport,
  ValuationValidationReport,
} from "./types.js";

export function buildValuationRunReportId(): string {
  return `eve-run-${Date.now()}`;
}

export class ValuationMetadataGenerator {
  buildRunReport(input: {
    action: ValuationRunReport["action"];
    engineRecord: EnterpriseValueEngineRecord;
    valuationRecords?: ValuationRecord[];
    historyEntries?: ValuationHistoryEntry[];
    anomalies?: ValuationAnomaly[];
    recommendations?: ValuationRecommendation[];
    validation: ValuationValidationReport;
    durationMs: number;
  }): ValuationRunReport {
    return {
      valuationRunReportId: buildValuationRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      valuationRecords: input.valuationRecords ?? [],
      historyEntries: input.historyEntries ?? [],
      anomalies: input.anomalies ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EVE_METADATA_VERSION,
    };
  }
}
