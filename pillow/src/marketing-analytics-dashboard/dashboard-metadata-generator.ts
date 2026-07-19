/** R5-10 — Dashboard Metadata Generator. */

import {
  MAD_CAPABILITIES,
  MAD_METADATA_VERSION,
  MARKETING_ANALYTICS_DASHBOARD_ID,
} from "./paths.js";
import type {
  DashboardEngineRecord,
  DashboardRunReport,
  DashboardSnapshot,
  DashboardValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class DashboardMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: DashboardEngineRecord["dependencyPresence"];
  }): DashboardEngineRecord {
    return {
      engineRecordId: `mad-${MARKETING_ANALYTICS_DASHBOARD_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MARKETING_ANALYTICS_DASHBOARD_ID,
      engineVersion: MAD_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...MAD_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: MAD_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: DashboardRunReport["action"];
    engineRecord: DashboardEngineRecord;
    snapshot: DashboardSnapshot | null;
    validation: DashboardValidationReport;
    durationMs: number;
  }): DashboardRunReport {
    return {
      dashboardRunReportId: `mad-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      snapshot: input.snapshot,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MAD_METADATA_VERSION,
    };
  }
}
