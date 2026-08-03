/** X3-05 — Marketing Metadata Generator. */

import { MSE_METADATA_VERSION } from "./paths.js";
import type {
  MarketingRecommendation,
  MarketingScaleEngineRecord,
  MarketingScalingRecord,
  MarketingValidationReport,
  MseRunReport,
} from "./types.js";

export function buildMarketingScaleRunReportId(): string {
  return `mse-run-${Date.now()}`;
}

export class MarketingMetadataGenerator {
  buildRunReport(input: {
    action: MseRunReport["action"];
    engineRecord: MarketingScaleEngineRecord;
    scalingRecords?: MarketingScalingRecord[];
    recommendations?: MarketingRecommendation[];
    validation: MarketingValidationReport;
    durationMs: number;
  }): MseRunReport {
    return {
      marketingScaleRunReportId: buildMarketingScaleRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      scalingRecords: input.scalingRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MSE_METADATA_VERSION,
    };
  }
}
