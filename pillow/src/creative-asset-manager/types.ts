/** PILLOW-CRA-001 — Creative Asset Manager types (R5-11). */

import type {
  APPROVAL_STATUSES,
  ASSET_TYPES,
  CRA_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  USAGE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CreativeAssetManagerConfiguration } from "./configuration.js";

export type CreativeAssetManagerEngineVersion = "PILLOW-CRA-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AssetType = (typeof ASSET_TYPES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type UsageStatus = (typeof USAGE_STATUSES)[number];
export type CraCapability = (typeof CRA_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CreativeEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CraCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    campaignManager: boolean;
    marketingAnalyticsDashboard: boolean;
  };
  metadataVersion: string;
};

export type CreativeAssetRecord = {
  assetId: string;
  timestamp: string;
  assetName: string;
  assetType: AssetType;
  campaignReference: string | null;
  version: number;
  approvalStatus: ApprovalStatus;
  usageStatus: UsageStatus;
  validationStatus: ValidationStatus;
  tags: string[];
  classification: string;
  storageRef: string;
  usageCount: number;
  metadataVersion: string;
};

export type AssetVersionRecord = {
  versionId: string;
  assetId: string;
  version: number;
  timestamp: string;
  changeSummary: string;
  approvalStatus: ApprovalStatus;
};

export type AssetUsageEvent = {
  usageEventId: string;
  assetId: string;
  timestamp: string;
  context: string;
  campaignReference: string | null;
};

export type CreativeValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CreativeRunReport = {
  creativeRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_asset"
    | "update_asset"
    | "create_version"
    | "approve_asset"
    | "reject_asset"
    | "tag_asset"
    | "track_usage"
    | "search_assets"
    | "classify_asset";
  engineRecord: CreativeEngineRecord;
  assetRecords: CreativeAssetRecord[];
  versions: AssetVersionRecord[];
  usageEvents: AssetUsageEvent[];
  validation: CreativeValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CreativeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CreativeValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAssets: number;
  approvedAssets: number;
  notes: string[];
};

export type CreativePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  assetsCreated: number;
  versionsCreated: number;
  approvalsProcessed: number;
  usageEventsTracked: number;
  searchesRun: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CreativeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CreativeAssetManagerState = {
  engineVersion: CreativeAssetManagerEngineVersion;
  missionId: "R5-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: CreativeAssetManagerConfiguration;
  latestReport: CreativeRunReport | null;
  engineRecord: CreativeEngineRecord | null;
  health: CreativeHealthReport;
  performance: CreativePerformanceStats;
};

export type CreativeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CreativeValidationReport["decision"] | null;
  totalAssets: number;
  approvedAssets: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCreativeAssetManagerInput = {
  forceReconnect?: boolean;
};

export type CreateAssetInput = {
  assetName: string;
  assetType: AssetType;
  campaignReference?: string;
  tags?: string[];
  storageRef?: string;
};

export type UpdateAssetInput = {
  assetId: string;
  assetName?: string;
  tags?: string[];
  campaignReference?: string;
  forceOverwriteApproved?: boolean;
};

export type CreateVersionInput = {
  assetId: string;
  changeSummary?: string;
};

export type ApproveAssetInput = {
  assetId: string;
  approved?: boolean;
};

export type TagAssetInput = {
  assetId: string;
  tags: string[];
};

export type TrackUsageInput = {
  assetId: string;
  context?: string;
  campaignReference?: string;
};

export type SearchAssetsInput = {
  query?: string;
  assetType?: AssetType;
  approvalStatus?: ApprovalStatus;
  tag?: string;
};

export type ClassifyAssetInput = {
  assetId: string;
};
