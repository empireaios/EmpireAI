/** X3-17 — Profit Metadata Generator. */



import { PSE_METADATA_VERSION } from "./paths.js";

import type {

  ProfitScalingRecommendation,

  ProfitScalingEngineRecord,

  ProfitScalingRecord,

  ProfitValidationReport,

  PseRunReport,

} from "./types.js";



export function buildProfitScalingEngineRunReportId(): string {

  return `pse-run-${Date.now()}`;

}



export class ProfitMetadataGenerator {

  buildRunReport(input: {

    action: PseRunReport["action"];

    engineRecord: ProfitScalingEngineRecord;

    profitScalingRecords?: ProfitScalingRecord[];

    recommendations?: ProfitScalingRecommendation[];

    validation: ProfitValidationReport;

    durationMs: number;

  }): PseRunReport {

    return {

      profitScalingEngineRunReportId: buildProfitScalingEngineRunReportId(),

      runTimestamp: new Date().toISOString(),

      action: input.action,

      engineRecord: input.engineRecord,

      profitScalingRecords: input.profitScalingRecords ?? [],

      recommendations: input.recommendations ?? [],

      validation: input.validation,

      durationMs: input.durationMs,

      metadataVersion: PSE_METADATA_VERSION,

    };

  }

}

