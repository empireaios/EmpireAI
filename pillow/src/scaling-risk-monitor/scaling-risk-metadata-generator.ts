/** X3-13 — Scaling Risk Metadata Generator. */

import { SRM_METADATA_VERSION } from "./paths.js";
import type {
  RiskMitigationRecommendation,
  ScalingRiskMonitorRecord,
  ScalingRiskRecord,
  ScalingRiskValidationReport,
  SrmRunReport,
} from "./types.js";

export function buildScalingRiskMonitorRunReportId(): string {
  return `srm-run-${Date.now()}`;
}

export class ScalingRiskMetadataGenerator {
  buildRunReport(input: {
    action: SrmRunReport["action"];
    engineRecord: ScalingRiskMonitorRecord;
    scalingRiskRecords?: ScalingRiskRecord[];
    recommendations?: RiskMitigationRecommendation[];
    validation: ScalingRiskValidationReport;
    durationMs: number;
  }): SrmRunReport {
    return {
      scalingRiskMonitorRunReportId: buildScalingRiskMonitorRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      scalingRiskRecords: input.scalingRiskRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SRM_METADATA_VERSION,
    };
  }
}
