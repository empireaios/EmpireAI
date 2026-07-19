/** X1-03 — Validation Metadata Generator. */

import {
  MARKET_VALIDATION_ENGINE_ID,
  MVE_CAPABILITIES,
  MVE_METADATA_VERSION,
} from "./paths.js";
import type {
  MarketValidationEngineRecord,
  MarketValidationRecord,
  MarketValidationReport,
  MarketValidationRunReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class ValidationMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: MarketValidationEngineRecord["dependencyPresence"];
  }): MarketValidationEngineRecord {
    return {
      engineRecordId: `mve-${MARKET_VALIDATION_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MARKET_VALIDATION_ENGINE_ID,
      engineVersion: MVE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...MVE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: MVE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: MarketValidationRunReport["action"];
    engineRecord: MarketValidationEngineRecord;
    validationRecords: MarketValidationRecord[];
    validation: MarketValidationReport;
    durationMs: number;
  }): MarketValidationRunReport {
    return {
      marketValidationRunReportId: `mve-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      validationRecords: input.validationRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MVE_METADATA_VERSION,
    };
  }
}
