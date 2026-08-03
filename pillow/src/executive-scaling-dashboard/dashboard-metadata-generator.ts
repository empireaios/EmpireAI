/** X3-09 — Dashboard Metadata Generator. */

import { ESD_METADATA_VERSION } from "./paths.js";
import type {
  ExecutiveDashboardSnapshot,
  ExecutiveDashboardValidationReport,
  ExecutiveScalingDashboardEngineRecord,
  ExecutiveScalingRecommendation,
  EsdRunReport,
} from "./types.js";

export function buildExecutiveScalingDashboardRunReportId(): string {
  return `esd-run-${Date.now()}`;
}

export class DashboardMetadataGenerator {
  buildRunReport(input: {
    action: EsdRunReport["action"];
    engineRecord: ExecutiveScalingDashboardEngineRecord;
    dashboardSnapshots?: ExecutiveDashboardSnapshot[];
    recommendations?: ExecutiveScalingRecommendation[];
    validation: ExecutiveDashboardValidationReport;
    durationMs: number;
  }): EsdRunReport {
    return {
      executiveScalingDashboardRunReportId: buildExecutiveScalingDashboardRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      dashboardSnapshots: input.dashboardSnapshots ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ESD_METADATA_VERSION,
    };
  }
}
