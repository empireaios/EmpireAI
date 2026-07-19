/** R5-14 — Conversion Metadata Generator. */

import {
  CONVERSION_INTELLIGENCE_ID,
  CVI_CAPABILITIES,
  CVI_METADATA_VERSION,
} from "./paths.js";
import type {
  ConversionEngineRecord,
  ConversionRecord,
  ConversionRunReport,
  ConversionValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class ConversionMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: ConversionEngineRecord["dependencyPresence"];
  }): ConversionEngineRecord {
    return {
      engineRecordId: `cvi-${CONVERSION_INTELLIGENCE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CONVERSION_INTELLIGENCE_ID,
      engineVersion: CVI_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CVI_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: CVI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ConversionRunReport["action"];
    engineRecord: ConversionEngineRecord;
    conversionRecords: ConversionRecord[];
    validation: ConversionValidationReport;
    durationMs: number;
  }): ConversionRunReport {
    return {
      conversionRunReportId: `cvi-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      conversionRecords: input.conversionRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CVI_METADATA_VERSION,
    };
  }
}
