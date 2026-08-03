/** X1-07 — Storefront Metadata Generator. */

import {
  SGE_CAPABILITIES,
  SGE_METADATA_VERSION,
  STORE_GENERATION_ENGINE_ID,
} from "./paths.js";
import type {
  HealthStatus,
  OperationalState,
  StorefrontEngineRecord,
  StorefrontRecord,
  StorefrontRunReport,
  StorefrontValidationReport,
  ValidationStatus,
} from "./types.js";

export class StorefrontMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: StorefrontEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): StorefrontEngineRecord {
    return {
      engineRecordId: `sge-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: STORE_GENERATION_ENGINE_ID,
      engineVersion: "PILLOW-SGE-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...SGE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: SGE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: StorefrontRunReport["action"];
    engineRecord: StorefrontEngineRecord;
    storefrontRecords: StorefrontRecord[];
    validation: StorefrontValidationReport;
    durationMs: number;
  }): StorefrontRunReport {
    return {
      storefrontRunReportId: `sge-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      storefrontRecords: input.storefrontRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SGE_METADATA_VERSION,
    };
  }
}
