/** X3-14 — Global Scaling Metadata Generator. */



import { GSP_METADATA_VERSION } from "./paths.js";

import type {

  GlobalExpansionRecommendation,

  GlobalScalingPlannerRecord,

  GlobalScalingRecord,

  GlobalScalingValidationReport,

  GspRunReport,

} from "./types.js";



export function buildGlobalScalingPlannerRunReportId(): string {

  return `gsp-run-${Date.now()}`;

}



export class GlobalScalingMetadataGenerator {

  buildRunReport(input: {

    action: GspRunReport["action"];

    engineRecord: GlobalScalingPlannerRecord;

    globalScalingRecords?: GlobalScalingRecord[];

    recommendations?: GlobalExpansionRecommendation[];

    validation: GlobalScalingValidationReport;

    durationMs: number;

  }): GspRunReport {

    return {

      globalScalingPlannerRunReportId: buildGlobalScalingPlannerRunReportId(),

      runTimestamp: new Date().toISOString(),

      action: input.action,

      engineRecord: input.engineRecord,

      globalScalingRecords: input.globalScalingRecords ?? [],

      recommendations: input.recommendations ?? [],

      validation: input.validation,

      durationMs: input.durationMs,

      metadataVersion: GSP_METADATA_VERSION,

    };

  }

}


