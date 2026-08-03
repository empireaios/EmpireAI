/** X1-14 — Revenue Metadata Generator. */

import {
  FIRST_REVENUE_OPTIMIZER_ID,
  FRO_CAPABILITIES,
  FRO_METADATA_VERSION,
} from "./paths.js";
import type {
  HealthStatus,
  OperationalState,
  RevenueOptimizationRecord,
  RevenueOptimizerEngineRecord,
  RevenueRunReport,
  RevenueValidationReport,
  ValidationStatus,
} from "./types.js";

export class RevenueMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: RevenueOptimizerEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): RevenueOptimizerEngineRecord {
    return {
      engineRecordId: `fro-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: FIRST_REVENUE_OPTIMIZER_ID,
      engineVersion: "PILLOW-FRO-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...FRO_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: FRO_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: RevenueRunReport["action"];
    engineRecord: RevenueOptimizerEngineRecord;
    revenueRecords: RevenueOptimizationRecord[];
    validation: RevenueValidationReport;
    durationMs: number;
  }): RevenueRunReport {
    return {
      revenueRunReportId: `fro-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      revenueRecords: input.revenueRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FRO_METADATA_VERSION,
    };
  }
}
