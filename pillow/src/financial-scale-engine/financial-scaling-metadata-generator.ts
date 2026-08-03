/** X3-07 — Financial Scaling Metadata Generator. */

import { FSE_METADATA_VERSION } from "./paths.js";
import type {
  FinancialRecommendation,
  FinancialScaleEngineRecord,
  FinancialScalingRecord,
  FinancialValidationReport,
  FseRunReport,
} from "./types.js";

export function buildFinancialScaleRunReportId(): string {
  return `fse-run-${Date.now()}`;
}

export class FinancialScalingMetadataGenerator {
  buildRunReport(input: {
    action: FseRunReport["action"];
    engineRecord: FinancialScaleEngineRecord;
    scalingRecords?: FinancialScalingRecord[];
    recommendations?: FinancialRecommendation[];
    validation: FinancialValidationReport;
    durationMs: number;
  }): FseRunReport {
    return {
      financialScaleRunReportId: buildFinancialScaleRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      scalingRecords: input.scalingRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FSE_METADATA_VERSION,
    };
  }
}
