import type { MediaFactoryCoreConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  CHANNEL_TYPES,
  CONTENT_STAGES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LEARNING_STATUSES,
  MFC_CAPABILITIES,
  MISSION_STATUSES,
  OPERATIONAL_STATES,
  PIPELINE_TYPES,
  PRODUCTION_STATUSES,
  PUBLISHING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ChannelType = (typeof CHANNEL_TYPES)[number];
export type PipelineType = (typeof PIPELINE_TYPES)[number];
export type ContentStage = (typeof CONTENT_STAGES)[number];
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type PublishingStatus = (typeof PUBLISHING_STATUSES)[number];
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MediaFactoryCoreCapability = (typeof MFC_CAPABILITIES)[number];

/** Machine-readable Media Business Mission (Q4-01). */
export type MediaBusinessMission = {
  mediaMissionId: string;
  timestamp: string;
  mediaBusinessId: string;
  mediaBusinessName: string;
  missionObjective: string;
  channelId: string | null;
  channelType: ChannelType | string;
  channelName: string | null;
  pipelineId: string | null;
  pipelineType: PipelineType | string;
  pipelineName: string | null;
  currentStage: ContentStage | string;
  currentStatus: MissionStatus | string;
  assignedWorkers: string[];
  assignedWorkerRoles: string[];
  approvalStatus: ApprovalStatus | string;
  publishingStatus: PublishingStatus | string;
  learningStatus: LearningStatus | string;
  productionStatus: ProductionStatus | string;
  executiveSummary: string;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  missionVersion: string;
  workerId: string;
  neverWriteScripts: true;
  neverGenerateImages: true;
  neverGenerateVideos: true;
  neverPublishDirectly: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ402OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Media Factory Report (Q4-01). */
export type MediaFactoryReport = {
  mediaMissionId: string;
  timestamp: string;
  mediaBusinessId: string;
  channelId: string | null;
  channelType: ChannelType | string;
  contentPipeline: PipelineType | string;
  currentStage: ContentStage | string;
  assignedWorkers: string[];
  approvalStatus: ApprovalStatus | string;
  publishingStatus: PublishingStatus | string;
  learningStatus: LearningStatus | string;
  executiveSummary: string;
  metadataVersion: string;
  productionStatus: ProductionStatus | string;
  missionCoordinationRef: string | null;
  executiveReportId: string | null;
  submittedToExecutiveReporting: boolean;
  assignedWorkerRoles: string[];
  pipelineId: string | null;
  traceabilityRefs: string[];
  preservedDecisions: string[];
  workerId: string;
  reportVersion: string;
  neverWriteScripts: true;
  neverGenerateImages: true;
  neverGenerateVideos: true;
  neverPublishDirectly: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ402OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export type MediaFactoryCoreInput = {
  mediaMissionId?: string | null;
  mediaBusinessId?: string | null;
  mediaBusinessName?: string | null;
  missionObjective?: string | null;
  channelId?: string | null;
  channelType?: ChannelType | string | null;
  channelName?: string | null;
  pipelineId?: string | null;
  pipelineType?: PipelineType | string | null;
  pipelineName?: string | null;
  currentStage?: ContentStage | string | null;
  assignedWorkers?: string[] | null;
  assignedWorkerRoles?: string[] | null;
  approvalStatus?: ApprovalStatus | string | null;
  publishingStatus?: PublishingStatus | string | null;
  learningStatus?: LearningStatus | string | null;
  productionStatus?: ProductionStatus | string | null;
  executiveSummary?: string | null;
  grandKingApproved?: boolean | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  writeScripts?: boolean;
  generateImages?: boolean;
  generateVideos?: boolean;
  publishDirectly?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ402OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MediaFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MediaFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MFC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MediaFactoryCoreCapability[];
  totalMissions: number;
  lastChannelType: ChannelType | string | null;
  lastPipelineType: PipelineType | string | null;
  lastMissionId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MediaFactoryCoreCatalog = {
  missionVersion: string;
  reportVersion: string;
  workerId: string;
  channelTypes: string[];
  pipelineTypes: string[];
  missions: MediaBusinessMission[];
  reports: MediaFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverWriteScripts: true;
  neverGenerateImages: true;
  neverGenerateVideos: true;
  neverPublishDirectly: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type MediaFactoryCoreRunReport = {
  mediaFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_media_business_mission"
    | "register_channel"
    | "register_pipeline"
    | "manage_lifecycle"
    | "coordinate_workers"
    | "coordinate_approval"
    | "coordinate_publishing"
    | "coordinate_analytics"
    | "coordinate_learning"
    | "track_production"
    | "track_publishing"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MediaFactoryCoreEngineRecord;
  catalog: MediaFactoryCoreCatalog | null;
  missions: MediaBusinessMission[];
  latestMission: MediaBusinessMission | null;
  latestReport: MediaFactoryReport | null;
  integrations: IntegrationHandshake[];
  validation: MediaFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MediaFactoryCoreState = {
  engineVersion: "PILLOW-MFC-001";
  missionId: "Q4-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: MediaFactoryCoreConfiguration;
  latestReport: MediaFactoryCoreRunReport | null;
  engineRecord: MediaFactoryCoreEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMissions: number;
    lastMissionId: string | null;
    notes: string[];
  };
};

export type MediaFactoryCoreCockpitSnapshot = {
  missionId: "Q4-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestMissionId: string | null;
  workerId: string;
  neverWriteScripts: true;
  neverGenerateImages: true;
  neverGenerateVideos: true;
  neverPublishDirectly: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
