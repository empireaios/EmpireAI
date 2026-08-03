/** X4-09 — Market Metadata Generator. */

import { GMI_METADATA_VERSION } from "./paths.js";
import type {
  GlobalMarketIntelligenceEngineRecord,
  GmiRunReport,
  MarketIntelligenceRecord,
  MarketRecommendation,
  MarketValidationReport,
} from "./types.js";

export class MarketMetadataGenerator {
  buildRunReport(input: {
    action: GmiRunReport["action"];
    engineRecord: GlobalMarketIntelligenceEngineRecord;
    marketRecords?: MarketIntelligenceRecord[];
    recommendations?: MarketRecommendation[];
    validation: MarketValidationReport;
    durationMs: number;
  }): GmiRunReport {
    return {
      marketRunReportId: `gmi-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      marketRecords: input.marketRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GMI_METADATA_VERSION,
    };
  }
}
