/** PILLOW-YAI-001 — YouTube Ads Integration types (R5-05). */

import type {
  AUTHENTICATION_STATUSES,
  CAMPAIGN_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  YAI_CAPABILITIES,
  OPERATIONAL_STATES,
  SYNCHRONIZATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";

export type YouTubeAdsIntegrationEngineVersion = "PILLOW-YAI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type YaiCapability = (typeof YAI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type YouTubeAdsEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  integrationId: string;
  integrationVersion: string;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: YaiCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
  googleAdsDependencyPresent: boolean;
  advertiserAccountId: string | null;
};

export type YouTubeAdsRecord = {
  youtubeAdsRecordId: string;
  timestamp: string;
  advertiserAccountId: string;
  campaignReference: string;
  adGroupReference: string | null;
  videoAssetReference: string | null;
  advertisementReference: string | null;
  campaignStatus: CampaignStatus;
  synchronizationStatus: SynchronizationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  views: number;
};

export type GoogleAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type YouTubeConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type YouTubeAdsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type YouTubeAdsRunReport = {
  youtubeAdsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_advertiser_account"
    | "create_campaign"
    | "create_ad_group"
    | "create_video_advertisement"
    | "manage_video_asset"
    | "retrieve_performance"
    | "sync_campaign_status";
  engineRecord: YouTubeAdsEngineRecord;
  youtubeAdsRecords: YouTubeAdsRecord[];
  validation: YouTubeAdsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type YouTubeAdsHealthReport = {
  status: HealthStatus;
  healthScore: number;
  integrationEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: YouTubeAdsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaigns: number;
  totalVideoAssets: number;
  notes: string[];
};

export type YouTubeAdsPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  campaignsCreated: number;
  adGroupsCreated: number;
  videoAdvertisementsCreated: number;
  videoAssetsManaged: number;
  performanceRetrievals: number;
  statusSyncs: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type YouTubeAdsLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type YouTubeAdsIntegrationState = {
  engineVersion: YouTubeAdsIntegrationEngineVersion;
  missionId: "R5-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: YouTubeAdsIntegrationConfiguration;
  latestReport: YouTubeAdsRunReport | null;
  engineRecord: YouTubeAdsEngineRecord | null;
  health: YouTubeAdsHealthReport;
  performance: YouTubeAdsPerformanceStats;
};

export type YouTubeAdsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: YouTubeAdsValidationReport["decision"] | null;
  campaignsCreated: number;
  videoAssetsManaged: number;
  frameworkRegistered: boolean;
  googleAdsDependencyPresent: boolean;
  recentLogs: string[];
};

export type ConnectYouTubeAdsInput = {
  credentialRef?: string;
  advertiserAccountId?: string;
  forceReconnect?: boolean;
};

export type ManageAdvertiserAccountInput = {
  advertiserAccountId?: string;
  advertiserName?: string;
  currency?: string;
};

export type CreateYouTubeCampaignInput = {
  campaignName: string;
  advertiserAccountId?: string;
  objective?: string;
};

export type CreateAdGroupInput = {
  campaignReference: string;
  adGroupName: string;
  dailyBudget?: number;
};

export type ManageVideoAssetInput = {
  videoAssetName: string;
  durationSeconds?: number;
  campaignReference?: string;
};

export type CreateVideoAdvertisementInput = {
  campaignReference: string;
  adGroupReference: string;
  videoAssetReference: string;
  advertisementName: string;
};

export type RetrieveYouTubePerformanceInput = {
  campaignReference?: string;
};

export type SyncYouTubeCampaignStatusInput = {
  campaignReference?: string;
};
