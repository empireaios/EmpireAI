/** R5-12 — Campaign Metadata Generator. */

import {
  ACG_CAPABILITIES,
  ACG_METADATA_VERSION,
  AI_CAMPAIGN_GENERATOR_ID,
} from "./paths.js";
import type {
  AiCampaignEngineRecord,
  AiCampaignRecord,
  AiCampaignRunReport,
  AiCampaignValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class CampaignMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: AiCampaignEngineRecord["dependencyPresence"];
  }): AiCampaignEngineRecord {
    return {
      engineRecordId: `acg-${AI_CAMPAIGN_GENERATOR_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AI_CAMPAIGN_GENERATOR_ID,
      engineVersion: ACG_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...ACG_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: ACG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: AiCampaignRunReport["action"];
    engineRecord: AiCampaignEngineRecord;
    campaignRecords: AiCampaignRecord[];
    validation: AiCampaignValidationReport;
    durationMs: number;
  }): AiCampaignRunReport {
    return {
      aiCampaignRunReportId: `acg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      campaignRecords: input.campaignRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ACG_METADATA_VERSION,
    };
  }
}
