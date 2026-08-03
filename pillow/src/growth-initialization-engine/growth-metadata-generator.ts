/** X1-12 — Growth Metadata Generator. */

import {
  GIE_CAPABILITIES,
  GIE_METADATA_VERSION,
  GROWTH_INITIALIZATION_ENGINE_ID,
} from "./paths.js";
import type {
  GrowthEngineRecord,
  GrowthPlanRecord,
  GrowthRunReport,
  GrowthValidationReport,
  HealthStatus,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class GrowthMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: GrowthEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): GrowthEngineRecord {
    return {
      engineRecordId: `gie-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: GROWTH_INITIALIZATION_ENGINE_ID,
      engineVersion: "PILLOW-GIE-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...GIE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: GIE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: GrowthRunReport["action"];
    engineRecord: GrowthEngineRecord;
    growthRecords: GrowthPlanRecord[];
    validation: GrowthValidationReport;
    durationMs: number;
  }): GrowthRunReport {
    return {
      growthRunReportId: `gie-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      growthRecords: input.growthRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GIE_METADATA_VERSION,
    };
  }
}
