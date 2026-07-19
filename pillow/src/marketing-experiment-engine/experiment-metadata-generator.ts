/** R5-17 — Experiment Metadata Generator. */

import {
  MARKETING_EXPERIMENT_ENGINE_ID,
  MEE_CAPABILITIES,
  MEE_METADATA_VERSION,
} from "./paths.js";
import type {
  ExperimentEngineRecord,
  ExperimentRecord,
  ExperimentRunReport,
  ExperimentValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class ExperimentMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: ExperimentEngineRecord["dependencyPresence"];
  }): ExperimentEngineRecord {
    return {
      engineRecordId: `mee-${MARKETING_EXPERIMENT_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MARKETING_EXPERIMENT_ENGINE_ID,
      engineVersion: MEE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...MEE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: MEE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ExperimentRunReport["action"];
    engineRecord: ExperimentEngineRecord;
    experimentRecords: ExperimentRecord[];
    validation: ExperimentValidationReport;
    durationMs: number;
  }): ExperimentRunReport {
    return {
      experimentRunReportId: `mee-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      experimentRecords: input.experimentRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MEE_METADATA_VERSION,
    };
  }
}
