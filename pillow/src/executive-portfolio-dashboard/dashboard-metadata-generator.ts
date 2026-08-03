/** X2-06 — Dashboard metadata generator. */

import { EPD_METADATA_VERSION } from "./paths.js";
import type {
  DashboardEngineRecord,
  DashboardRunReport,
  DashboardValidationReport,
  PortfolioDashboardSnapshot,
} from "./types.js";

export function buildDashboardRunReportId(): string {
  return `epd-run-${Date.now()}`;
}

export class DashboardMetadataGenerator {
  buildRunReport(input: {
    action: DashboardRunReport["action"];
    engineRecord: DashboardEngineRecord;
    snapshot: PortfolioDashboardSnapshot | null;
    validation: DashboardValidationReport;
    durationMs: number;
  }): DashboardRunReport {
    return {
      dashboardRunReportId: buildDashboardRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      snapshot: input.snapshot,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EPD_METADATA_VERSION,
    };
  }
}
