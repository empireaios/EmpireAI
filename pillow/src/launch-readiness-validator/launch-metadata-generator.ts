/** X1-10 — Launch Metadata Generator. */

import {
  LAUNCH_READINESS_VALIDATOR_ID,
  LRV_CAPABILITIES,
  LRV_METADATA_VERSION,
} from "./paths.js";
import type {
  HealthStatus,
  LaunchEngineRecord,
  LaunchReadinessRecord,
  LaunchRunReport,
  LaunchValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class LaunchMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: LaunchEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): LaunchEngineRecord {
    return {
      engineRecordId: `lrv-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: LAUNCH_READINESS_VALIDATOR_ID,
      engineVersion: "PILLOW-LRV-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...LRV_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: LRV_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: LaunchRunReport["action"];
    engineRecord: LaunchEngineRecord;
    readinessRecords: LaunchReadinessRecord[];
    validation: LaunchValidationReport;
    durationMs: number;
  }): LaunchRunReport {
    return {
      launchRunReportId: `lrv-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      readinessRecords: input.readinessRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LRV_METADATA_VERSION,
    };
  }
}
