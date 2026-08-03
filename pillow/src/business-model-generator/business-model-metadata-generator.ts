/** X1-04 — Business Model Metadata Generator. */

import {
  BMG_CAPABILITIES,
  BMG_METADATA_VERSION,
  BUSINESS_MODEL_GENERATOR_ID,
} from "./paths.js";
import type {
  BusinessModelEngineRecord,
  BusinessModelRecord,
  BusinessModelRunReport,
  BusinessModelValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class BusinessModelMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: BusinessModelEngineRecord["dependencyPresence"];
  }): BusinessModelEngineRecord {
    return {
      engineRecordId: `bmg-${BUSINESS_MODEL_GENERATOR_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_MODEL_GENERATOR_ID,
      engineVersion: BMG_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BMG_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: BusinessModelRunReport["action"];
    engineRecord: BusinessModelEngineRecord;
    businessModelRecords: BusinessModelRecord[];
    validation: BusinessModelValidationReport;
    durationMs: number;
  }): BusinessModelRunReport {
    return {
      businessModelRunReportId: `bmg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      businessModelRecords: input.businessModelRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BMG_METADATA_VERSION,
    };
  }
}
