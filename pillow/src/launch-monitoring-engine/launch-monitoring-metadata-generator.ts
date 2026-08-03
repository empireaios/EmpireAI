/** X1-13 — Launch Monitoring Metadata Generator. */

import {
  LAUNCH_MONITORING_ENGINE_ID,
  LME_CAPABILITIES,
  LME_METADATA_VERSION,
} from "./paths.js";
import type {
  HealthStatus,
  LaunchMonitoringEngineRecord,
  LaunchMonitoringRecord,
  LaunchMonitoringRunReport,
  LaunchMonitoringValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class LaunchMonitoringMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: LaunchMonitoringEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): LaunchMonitoringEngineRecord {
    return {
      engineRecordId: `lme-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: LAUNCH_MONITORING_ENGINE_ID,
      engineVersion: "PILLOW-LME-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...LME_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: LME_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: LaunchMonitoringRunReport["action"];
    engineRecord: LaunchMonitoringEngineRecord;
    monitoringRecords: LaunchMonitoringRecord[];
    validation: LaunchMonitoringValidationReport;
    durationMs: number;
  }): LaunchMonitoringRunReport {
    return {
      launchMonitoringRunReportId: `lme-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      monitoringRecords: input.monitoringRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LME_METADATA_VERSION,
    };
  }
}
