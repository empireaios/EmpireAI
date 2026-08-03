/** X1-06 — Digital Asset Metadata Generator. */

import {
  DAP_CAPABILITIES,
  DAP_METADATA_VERSION,
  DOMAIN_DIGITAL_ASSET_PLANNER_ID,
} from "./paths.js";
import type {
  DigitalAssetEngineRecord,
  DigitalAssetPlanRecord,
  DigitalAssetRunReport,
  DigitalAssetValidationReport,
  HealthStatus,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class DigitalAssetMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: DigitalAssetEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): DigitalAssetEngineRecord {
    return {
      engineRecordId: `dap-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: DOMAIN_DIGITAL_ASSET_PLANNER_ID,
      engineVersion: "PILLOW-DAP-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...DAP_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: DAP_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: DigitalAssetRunReport["action"];
    engineRecord: DigitalAssetEngineRecord;
    planRecords: DigitalAssetPlanRecord[];
    validation: DigitalAssetValidationReport;
    durationMs: number;
  }): DigitalAssetRunReport {
    return {
      digitalAssetRunReportId: `dap-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      planRecords: input.planRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: DAP_METADATA_VERSION,
    };
  }
}
