/** PILLOW-CAM-001 — Campaign Manager types (R5-07). */

import type {
  CAM_CAPABILITIES,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUSES,
  ENGINE_STATUSES,
  EXECUTION_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CampaignManagerConfiguration } from "./configuration.js";

export type CampaignManagerEngineVersion = "PILLOW-CAM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];
export type CamCapability = (typeof CAM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CampaignSchedule = {
  startAt: string;
  endAt: string | null;
  timezone: string;
};

export type CampaignEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CamCapability[];
  frameworkModuleId: string | null;
  channelDependencies: {
    meta: boolean;
    google: boolean;
    tiktok: boolean;
    youtube: boolean;
    seo: boolean;
  };
  metadataVersion: string;
};

export type CampaignRecord = {
  campaignId: string;
  timestamp: string;
  campaignName: string;
  campaignObjective: CampaignObjective;
  marketingChannels: MarketingChannel[];
  campaignSchedule: CampaignSchedule;
  campaignStatus: CampaignStatus;
  executionStatus: ExecutionStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  approvalRequired: true;
  approvedAt: string | null;
  failureSummary: string | null;
  channelExecution: Partial<Record<MarketingChannel, ExecutionStatus>>;
};

export type CampaignValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CampaignRunReport = {
  campaignRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_campaign"
    | "update_lifecycle"
    | "set_objective"
    | "schedule_campaign"
    | "update_status"
    | "coordinate_channels"
    | "track_execution"
    | "detect_failures"
    | "approve_campaign";
  engineRecord: CampaignEngineRecord;
  campaignRecords: CampaignRecord[];
  validation: CampaignValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CampaignHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CampaignValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaigns: number;
  runningCampaigns: number;
  failedCampaigns: number;
  notes: string[];
};

export type CampaignPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  campaignsCreated: number;
  campaignsScheduled: number;
  campaignsApproved: number;
  coordinationsRun: number;
  executionsTracked: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CampaignLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CampaignManagerState = {
  engineVersion: CampaignManagerEngineVersion;
  missionId: "R5-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: CampaignManagerConfiguration;
  latestReport: CampaignRunReport | null;
  engineRecord: CampaignEngineRecord | null;
  health: CampaignHealthReport;
  performance: CampaignPerformanceStats;
};

export type CampaignCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CampaignValidationReport["decision"] | null;
  campaignsCreated: number;
  runningCampaigns: number;
  frameworkRegistered: boolean;
  channelsConnected: number;
  recentLogs: string[];
};

export type ConnectCampaignManagerInput = {
  forceReconnect?: boolean;
};

export type CreateCampaignInput = {
  campaignName: string;
  campaignObjective: CampaignObjective;
  marketingChannels: MarketingChannel[];
  startAt?: string;
  endAt?: string | null;
  timezone?: string;
};

export type UpdateLifecycleInput = {
  campaignId: string;
  targetStatus: CampaignStatus;
};

export type SetObjectiveInput = {
  campaignId: string;
  campaignObjective: CampaignObjective;
};

export type ScheduleCampaignInput = {
  campaignId: string;
  startAt: string;
  endAt?: string | null;
  timezone?: string;
};

export type UpdateStatusInput = {
  campaignId: string;
  campaignStatus: CampaignStatus;
};

export type CoordinateChannelsInput = {
  campaignId: string;
};

export type TrackExecutionInput = {
  campaignId?: string;
};

export type DetectFailuresInput = {
  campaignId?: string;
};

export type ApproveCampaignInput = {
  campaignId: string;
};
