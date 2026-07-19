/** R5-19 — Autonomous Marketing Metadata Generator. */

import {
  AME_CAPABILITIES,
  AME_METADATA_VERSION,
  AUTONOMOUS_MARKETING_ENGINE_ID,
} from "./paths.js";
import type {
  AutonomousMarketingEngineRecord,
  AutonomousMarketingRecord,
  AutonomousMarketingRunReport,
  AutonomousMarketingValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class AutonomousMarketingMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: AutonomousMarketingEngineRecord["dependencyPresence"];
  }): AutonomousMarketingEngineRecord {
    return {
      engineRecordId: `ame-${AUTONOMOUS_MARKETING_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTONOMOUS_MARKETING_ENGINE_ID,
      engineVersion: AME_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...AME_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: AME_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: AutonomousMarketingRunReport["action"];
    engineRecord: AutonomousMarketingEngineRecord;
    autonomousMarketingRecords: AutonomousMarketingRecord[];
    validation: AutonomousMarketingValidationReport;
    durationMs: number;
  }): AutonomousMarketingRunReport {
    return {
      autonomousMarketingRunReportId: `ame-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      autonomousMarketingRecords: input.autonomousMarketingRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AME_METADATA_VERSION,
    };
  }
}
