/** X4-08 — Logistics Metadata Generator. */

import { ILE_METADATA_VERSION } from "./paths.js";
import type {
  IleRunReport,
  InternationalLogisticsEngineRecord,
  LogisticsRecommendation,
  LogisticsRecord,
  LogisticsValidationReport,
} from "./types.js";

export class LogisticsMetadataGenerator {
  buildRunReport(input: {
    action: IleRunReport["action"];
    engineRecord: InternationalLogisticsEngineRecord;
    logisticsRecords?: LogisticsRecord[];
    recommendations?: LogisticsRecommendation[];
    validation: LogisticsValidationReport;
    durationMs: number;
  }): IleRunReport {
    return {
      logisticsRunReportId: `ile-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      logisticsRecords: input.logisticsRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ILE_METADATA_VERSION,
    };
  }
}
