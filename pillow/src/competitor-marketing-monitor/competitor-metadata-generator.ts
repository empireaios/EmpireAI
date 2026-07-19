/** R5-15 — Competitor Metadata Generator. */

import {
  CMM_CAPABILITIES,
  CMM_METADATA_VERSION,
  COMPETITOR_MARKETING_MONITOR_ID,
} from "./paths.js";
import type {
  CompetitorEngineRecord,
  CompetitorRecord,
  CompetitorRunReport,
  CompetitorValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class CompetitorMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: CompetitorEngineRecord["dependencyPresence"];
  }): CompetitorEngineRecord {
    return {
      engineRecordId: `cmm-${COMPETITOR_MARKETING_MONITOR_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COMPETITOR_MARKETING_MONITOR_ID,
      engineVersion: CMM_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CMM_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: CMM_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CompetitorRunReport["action"];
    engineRecord: CompetitorEngineRecord;
    competitorRecords: CompetitorRecord[];
    validation: CompetitorValidationReport;
    durationMs: number;
  }): CompetitorRunReport {
    return {
      competitorRunReportId: `cmm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      competitorRecords: input.competitorRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CMM_METADATA_VERSION,
    };
  }
}
