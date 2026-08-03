/** X4-05 — Currency Metadata Generator. */

import { CUR_METADATA_VERSION } from "./paths.js";
import type {
  CurrencyIntelligenceEngineRecord,
  CurrencyIntelligenceRecord,
  CurrencyRecommendation,
  CurrencyValidationReport,
  CurRunReport,
} from "./types.js";

export class CurrencyMetadataGenerator {
  buildRunReport(input: {
    action: CurRunReport["action"];
    engineRecord: CurrencyIntelligenceEngineRecord;
    currencyRecords?: CurrencyIntelligenceRecord[];
    recommendations?: CurrencyRecommendation[];
    validation: CurrencyValidationReport;
    durationMs: number;
    convertedAmount?: number | null;
  }): CurRunReport {
    return {
      currencyRunReportId: `cur-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      currencyRecords: input.currencyRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CUR_METADATA_VERSION,
      convertedAmount: input.convertedAmount ?? null,
    };
  }
}
