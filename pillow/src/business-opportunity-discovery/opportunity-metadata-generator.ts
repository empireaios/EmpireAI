/** X1-02 — Opportunity Metadata Generator. */

import {
  BOD_CAPABILITIES,
  BOD_METADATA_VERSION,
  BUSINESS_OPPORTUNITY_DISCOVERY_ID,
} from "./paths.js";
import type {
  OpportunityEngineRecord,
  OpportunityRecord,
  OpportunityRunReport,
  OpportunityValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class OpportunityMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: OpportunityEngineRecord["dependencyPresence"];
  }): OpportunityEngineRecord {
    return {
      engineRecordId: `bod-${BUSINESS_OPPORTUNITY_DISCOVERY_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_OPPORTUNITY_DISCOVERY_ID,
      engineVersion: BOD_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...BOD_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: BOD_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: OpportunityRunReport["action"];
    engineRecord: OpportunityEngineRecord;
    opportunityRecords: OpportunityRecord[];
    validation: OpportunityValidationReport;
    durationMs: number;
  }): OpportunityRunReport {
    return {
      opportunityRunReportId: `bod-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      opportunityRecords: input.opportunityRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BOD_METADATA_VERSION,
    };
  }
}
