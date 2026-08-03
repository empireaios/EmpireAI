/** X4-10 — Dashboard Metadata Generator. */

import { EGD_METADATA_VERSION } from "./paths.js";
import type {
  DashboardRecommendation,
  DashboardSnapshot,
  DashboardValidationReport,
  EgdRunReport,
  ExecutiveGlobalDashboardEngineRecord,
} from "./types.js";

export class DashboardMetadataGenerator {
  buildRunReport(input: {
    action: EgdRunReport["action"];
    engineRecord: ExecutiveGlobalDashboardEngineRecord;
    snapshots?: DashboardSnapshot[];
    recommendations?: DashboardRecommendation[];
    validation: DashboardValidationReport;
    durationMs: number;
  }): EgdRunReport {
    return {
      dashboardRunReportId: `egd-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      snapshots: input.snapshots ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EGD_METADATA_VERSION,
    };
  }
}
