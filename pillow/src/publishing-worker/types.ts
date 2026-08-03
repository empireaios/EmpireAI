import type { PublishingWorkerConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PBW_CAPABILITIES,
  PUBLISHING_PLATFORMS,
  QUALITY_STATUSES,
  READINESS_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PublishingPlatform = (typeof PUBLISHING_PLATFORMS)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PublishingWorkerCapability = (typeof PBW_CAPABILITIES)[number];

export type ThumbnailReference = {
  thumbnailId: string;
  assetPath: string;
  approved: true;
};

export type PlaylistRef = {
  playlistId: string;
  name: string;
  platform: PublishingPlatform;
};

export type UploadPackage = {
  packageId: string;
  platform: PublishingPlatform;
  mediaId: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailId: string;
  playlistId: string;
  assetRefs: string[];
  packagePath: string;
};

export type PublishingReadiness = {
  status: ReadinessStatus;
  platformValidated: boolean;
  approvalValidated: boolean;
  metadataComplete: boolean;
  notes: string;
  score: number;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Publishing Report (Q4-14). */
export type PublishingReport = {
  publishingReportId: string;
  timestamp: string;
  mediaId: string;
  targetPlatform: PublishingPlatform;
  videoTitle: string;
  description: string;
  tags: string[];
  thumbnailReference: ThumbnailReference;
  playlist: PlaylistRef;
  scheduledPublishTime: string;
  uploadPackage: UploadPackage;
  publishingReadiness: PublishingReadiness;
  metadataVersion: string;
  channelId: string;
  assemblyId: string | null;
  scriptId: string | null;
  workerId: string;
  reportVersion: string;
  approvalStatus: ApprovalStatus;
  pillowAuthorizationRequired: true;
  automaticallyPublishAuthorized: false;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverAutomaticallyPublishContent: true;
  neverModifyApprovedMediaAssets: true;
  neverOverrideApprovalWorkflows: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ415OrLater: true;
  preserveCompleteAssetTraceability: true;
  preservePublishingMetadataHistory: true;
  validatePlatformRequirements: true;
  validateApprovalStatusBeforePublication: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type PublishingWorkerInput = {
  publishingReportId?: string | null;
  mediaId?: string | null;
  channelId?: string | null;
  assemblyId?: string | null;
  scriptId?: string | null;
  targetPlatform?: PublishingPlatform | string | null;
  videoTitle?: string | null;
  description?: string | null;
  tags?: string[] | null;
  thumbnailId?: string | null;
  thumbnailPath?: string | null;
  playlistName?: string | null;
  scheduledPublishTime?: string | null;
  mediaAssetRefs?: string[] | null;
  topicTitle?: string | null;
  hookText?: string | null;
  narrationReadyText?: string | null;
  approvalStatus?: ApprovalStatus | string | null;
  /** Even if true, never auto-publish — only affects readiness pending_approval vs ready. */
  pillowAuthorized?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  automaticallyPublishContent?: boolean;
  modifyApprovedMediaAssets?: boolean;
  overrideApprovalWorkflows?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ415OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PublishingWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PublishingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PBW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PublishingWorkerCapability[];
  totalPublishingReports: number;
  lastPublishingReportId: string | null;
  lastMediaId: string | null;
  lastTargetPlatform: PublishingPlatform | null;
  lastReadinessStatus: ReadinessStatus | null;
  lastApprovalStatus: ApprovalStatus | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PublishingWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  publishingReports: PublishingReport[];
  integrations: IntegrationHandshake[];
  supportedPlatforms: PublishingPlatform[];
  readinessStatuses: ReadinessStatus[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverAutomaticallyPublishContent: true;
  neverModifyApprovedMediaAssets: true;
  neverOverrideApprovalWorkflows: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ415OrLater: true;
};

export type PublishingWorkerRunReport = {
  publishingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_completed_media_assets"
    | "generate_optimized_video_titles"
    | "generate_platform_descriptions"
    | "generate_tags_and_keywords"
    | "select_approved_thumbnails"
    | "generate_playlists"
    | "generate_publishing_schedules"
    | "prepare_platform_upload_packages"
    | "validate_publishing_readiness"
    | "produce_publishing_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: PublishingWorkerEngineRecord;
  catalog: PublishingWorkerCatalog | null;
  publishingReports: PublishingReport[];
  latestPublishingReport: PublishingReport | null;
  integrations: IntegrationHandshake[];
  validation: PublishingWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PublishingWorkerState = {
  engineVersion: "PILLOW-PBW-001";
  missionId: "Q4-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: PublishingWorkerConfiguration;
  latestReport: PublishingWorkerRunReport | null;
  engineRecord: PublishingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPublishingReports: number;
    lastPublishingReportId: string | null;
    lastMediaId: string | null;
    lastTargetPlatform: PublishingPlatform | null;
    lastReadinessStatus: ReadinessStatus | null;
    lastApprovalStatus: ApprovalStatus | null;
    notes: string[];
  };
};

export type PublishingWorkerCockpitSnapshot = {
  missionId: "Q4-14";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPublishingReports: number;
  latestPublishingReportId: string | null;
  lastMediaId: string | null;
  lastTargetPlatform: PublishingPlatform | null;
  lastReadinessStatus: ReadinessStatus | null;
  lastApprovalStatus: ApprovalStatus | null;
  workerId: string;
  neverAutomaticallyPublishContent: true;
  neverModifyApprovedMediaAssets: true;
  neverOverrideApprovalWorkflows: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ415OrLater: true;
};

export type PublishContext = {
  mediaId?: string | null;
  channelId?: string | null;
  assemblyId?: string | null;
  scriptId?: string | null;
  targetPlatform?: PublishingPlatform | null;
  videoTitle?: string | null;
  description?: string | null;
  tags?: string[];
  thumbnailId?: string | null;
  thumbnailPath?: string | null;
  playlistName?: string | null;
  scheduledPublishTime?: string | null;
  mediaAssetRefs?: string[];
  topicTitle?: string | null;
  hookText?: string | null;
  narrationReadyText?: string | null;
  approvalStatus?: ApprovalStatus | null;
  pillowAuthorized?: boolean;
  receivedMedia?: boolean;
  thumbnailReference?: ThumbnailReference | null;
  playlist?: PlaylistRef | null;
  uploadPackage?: UploadPackage | null;
  publishingReadiness?: PublishingReadiness | null;
};
