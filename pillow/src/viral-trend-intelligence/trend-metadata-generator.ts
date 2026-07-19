/** R5-16 — Trend Metadata Generator. */

import {
  VIRAL_TREND_INTELLIGENCE_ID,
  VTI_CAPABILITIES,
  VTI_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  TrendEngineRecord,
  TrendRecord,
  TrendRunReport,
  TrendValidationReport,
  ValidationStatus,
} from "./types.js";

export class TrendMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: TrendEngineRecord["dependencyPresence"];
  }): TrendEngineRecord {
    return {
      engineRecordId: `vti-${VIRAL_TREND_INTELLIGENCE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: VIRAL_TREND_INTELLIGENCE_ID,
      engineVersion: VTI_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...VTI_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: VTI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: TrendRunReport["action"];
    engineRecord: TrendEngineRecord;
    trendRecords: TrendRecord[];
    validation: TrendValidationReport;
    durationMs: number;
  }): TrendRunReport {
    return {
      trendRunReportId: `vti-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      trendRecords: input.trendRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: VTI_METADATA_VERSION,
    };
  }
}
