/** X4-07 — Tax Metadata Generator. */

import { GTI_METADATA_VERSION } from "./paths.js";
import type {
  GlobalTaxIntelligenceEngineRecord,
  GtiRunReport,
  TaxIntelligenceRecord,
  TaxRecommendation,
  TaxValidationReport,
} from "./types.js";

export class TaxMetadataGenerator {
  buildRunReport(input: {
    action: GtiRunReport["action"];
    engineRecord: GlobalTaxIntelligenceEngineRecord;
    taxRecords?: TaxIntelligenceRecord[];
    recommendations?: TaxRecommendation[];
    validation: TaxValidationReport;
    durationMs: number;
  }): GtiRunReport {
    return {
      taxRunReportId: `gti-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      taxRecords: input.taxRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GTI_METADATA_VERSION,
    };
  }
}
