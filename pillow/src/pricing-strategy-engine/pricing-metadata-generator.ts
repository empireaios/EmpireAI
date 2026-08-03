/** X1-09 — Pricing Metadata Generator. */

import {
  PRICING_STRATEGY_ENGINE_ID,
  PSE_CAPABILITIES,
  PSE_METADATA_VERSION,
} from "./paths.js";
import type {
  HealthStatus,
  OperationalState,
  PricingEngineRecord,
  PricingRecord,
  PricingRunReport,
  PricingValidationReport,
  ValidationStatus,
} from "./types.js";

export class PricingMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: PricingEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): PricingEngineRecord {
    return {
      engineRecordId: `pse-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: PRICING_STRATEGY_ENGINE_ID,
      engineVersion: "PILLOW-PSE-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...PSE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: PSE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: PricingRunReport["action"];
    engineRecord: PricingEngineRecord;
    pricingRecords: PricingRecord[];
    validation: PricingValidationReport;
    durationMs: number;
  }): PricingRunReport {
    return {
      pricingRunReportId: `pse-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      pricingRecords: input.pricingRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PSE_METADATA_VERSION,
    };
  }
}
