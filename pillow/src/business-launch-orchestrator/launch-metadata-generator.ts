/** X1-11 — Launch Metadata Generator. */

import {
  BLO_CAPABILITIES,
  BLO_METADATA_VERSION,
  BUSINESS_LAUNCH_ORCHESTRATOR_ID,
} from "./paths.js";
import type {
  BusinessLaunchRecord,
  HealthStatus,
  LaunchOrchestratorEngineRecord,
  LaunchOrchestratorRunReport,
  LaunchOrchestratorValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class LaunchMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: LaunchOrchestratorEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): LaunchOrchestratorEngineRecord {
    return {
      engineRecordId: `blo-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_LAUNCH_ORCHESTRATOR_ID,
      engineVersion: "PILLOW-BLO-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BLO_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: BLO_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: LaunchOrchestratorRunReport["action"];
    engineRecord: LaunchOrchestratorEngineRecord;
    launchRecords: BusinessLaunchRecord[];
    validation: LaunchOrchestratorValidationReport;
    durationMs: number;
  }): LaunchOrchestratorRunReport {
    return {
      launchRunReportId: `blo-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      launchRecords: input.launchRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BLO_METADATA_VERSION,
    };
  }

  buildLaunchReport(record: BusinessLaunchRecord): string {
    return [
      `launch=${record.launchId}`,
      `stage=${record.currentLaunchStage}`,
      `progress=${record.launchProgress}%`,
      `status=${record.launchStatus}`,
      `recovery=${record.recoveryStatus}`,
      `deps=${record.dependencySummary}`,
    ].join(" · ");
  }
}
