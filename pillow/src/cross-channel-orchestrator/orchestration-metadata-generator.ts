/** R5-18 — Orchestration Metadata Generator. */

import {
  CCO_CAPABILITIES,
  CCO_METADATA_VERSION,
  CROSS_CHANNEL_ORCHESTRATOR_ID,
} from "./paths.js";
import type {
  OperationalState,
  OrchestrationEngineRecord,
  OrchestrationRecord,
  OrchestrationRunReport,
  OrchestrationValidationReport,
  ValidationStatus,
} from "./types.js";

export class OrchestrationMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: OrchestrationEngineRecord["dependencyPresence"];
  }): OrchestrationEngineRecord {
    return {
      engineRecordId: `cco-${CROSS_CHANNEL_ORCHESTRATOR_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CROSS_CHANNEL_ORCHESTRATOR_ID,
      engineVersion: CCO_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CCO_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: CCO_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: OrchestrationRunReport["action"];
    engineRecord: OrchestrationEngineRecord;
    orchestrationRecords: OrchestrationRecord[];
    validation: OrchestrationValidationReport;
    durationMs: number;
  }): OrchestrationRunReport {
    return {
      orchestrationRunReportId: `cco-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      orchestrationRecords: input.orchestrationRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CCO_METADATA_VERSION,
    };
  }
}
