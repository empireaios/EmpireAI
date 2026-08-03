/** X1-05 — Brand Metadata Generator. */

import {
  BCE_CAPABILITIES,
  BCE_METADATA_VERSION,
  BRAND_CREATION_ENGINE_ID,
} from "./paths.js";
import type {
  BrandEngineRecord,
  BrandRecord,
  BrandRunReport,
  BrandValidationReport,
  HealthStatus,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class BrandMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: BrandEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): BrandEngineRecord {
    return {
      engineRecordId: `bce-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: BRAND_CREATION_ENGINE_ID,
      engineVersion: "PILLOW-BCE-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BCE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: BCE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: BrandRunReport["action"];
    engineRecord: BrandEngineRecord;
    brandRecords: BrandRecord[];
    validation: BrandValidationReport;
    durationMs: number;
  }): BrandRunReport {
    return {
      brandRunReportId: `bce-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      brandRecords: input.brandRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BCE_METADATA_VERSION,
    };
  }
}
