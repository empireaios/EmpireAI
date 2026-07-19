/** R5-07 — Campaign Metadata Generator. */

import { CAM_CAPABILITIES, CAM_METADATA_VERSION, CAMPAIGN_MANAGER_ID } from "./paths.js";
import type {
  CampaignEngineRecord,
  CampaignObjective,
  CampaignRecord,
  CampaignRunReport,
  CampaignSchedule,
  CampaignValidationReport,
  MarketingChannel,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class CampaignMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    channelDependencies: CampaignEngineRecord["channelDependencies"];
  }): CampaignEngineRecord {
    return {
      engineRecordId: `cam-${CAMPAIGN_MANAGER_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CAMPAIGN_MANAGER_ID,
      engineVersion: CAM_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CAM_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      channelDependencies: input.channelDependencies,
      metadataVersion: CAM_METADATA_VERSION,
    };
  }

  buildCampaignRecord(input: {
    campaignName: string;
    campaignObjective: CampaignObjective;
    marketingChannels: MarketingChannel[];
    campaignSchedule: CampaignSchedule;
  }): CampaignRecord {
    return {
      campaignId: `cam-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      campaignName: input.campaignName,
      campaignObjective: input.campaignObjective,
      marketingChannels: [...input.marketingChannels],
      campaignSchedule: { ...input.campaignSchedule },
      campaignStatus: "draft",
      executionStatus: "not_started",
      validationStatus: "pending",
      metadataVersion: CAM_METADATA_VERSION,
      approvalRequired: true,
      approvedAt: null,
      failureSummary: null,
      channelExecution: Object.fromEntries(
        input.marketingChannels.map((c) => [c, "not_started" as const]),
      ),
    };
  }

  buildRunReport(input: {
    action: CampaignRunReport["action"];
    engineRecord: CampaignEngineRecord;
    campaignRecords: CampaignRecord[];
    validation: CampaignValidationReport;
    durationMs: number;
  }): CampaignRunReport {
    return {
      campaignRunReportId: `cam-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      campaignRecords: input.campaignRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CAM_METADATA_VERSION,
    };
  }
}
