/** PILLOW-TAI-001 — TikTok Ads Integration types (R5-04). */

import type {
  AUTHENTICATION_STATUSES,
  CAMPAIGN_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  TAI_CAPABILITIES,
  OPERATIONAL_STATES,
  SYNCHRONIZATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";

export type TikTokAdsIntegrationEngineVersion = "PILLOW-TAI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type TaiCapability = (typeof TAI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TikTokAdsEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  integrationId: string;
  integrationVersion: string;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: TaiCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
  advertiserAccountId: string | null;
};

export type TikTokAdsRecord = {
  tiktokAdsRecordId: string;
  timestamp: string;
  advertiserAccountId: string;
  campaignReference: string;
  adGroupReference: string | null;
  advertisementReference: string | null;
  audienceReference: string | null;
  campaignStatus: CampaignStatus;
  synchronizationStatus: SynchronizationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type TikTokAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type TikTokConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type TikTokAdsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TikTokAdsRunReport = {
  tiktokAdsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_advertiser_account"
    | "create_campaign"
    | "create_ad_group"
    | "create_advertisement"
    | "retrieve_performance"
    | "sync_campaign_status"
    | "sync_audience";
  engineRecord: TikTokAdsEngineRecord;
  tiktokAdsRecords: TikTokAdsRecord[];
  validation: TikTokAdsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TikTokAdsHealthReport = {
  status: HealthStatus;
  healthScore: number;
  integrationEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: TikTokAdsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaigns: number;
  notes: string[];
};

export type TikTokAdsPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  campaignsCreated: number;
  adGroupsCreated: number;
  advertisementsCreated: number;
  performanceRetrievals: number;
  statusSyncs: number;
  audienceSyncs: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TikTokAdsLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type TikTokAdsIntegrationState = {
  engineVersion: TikTokAdsIntegrationEngineVersion;
  missionId: "R5-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: TikTokAdsIntegrationConfiguration;
  latestReport: TikTokAdsRunReport | null;
  engineRecord: TikTokAdsEngineRecord | null;
  health: TikTokAdsHealthReport;
  performance: TikTokAdsPerformanceStats;
};

export type TikTokAdsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: TikTokAdsValidationReport["decision"] | null;
  campaignsCreated: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectTikTokAdsInput = {
  credentialRef?: string;
  advertiserAccountId?: string;
  forceReconnect?: boolean;
};

export type ManageAdvertiserAccountInput = {
  advertiserAccountId?: string;
  advertiserName?: string;
  currency?: string;
};

export type CreateTikTokCampaignInput = {
  campaignName: string;
  advertiserAccountId?: string;
  objective?: string;
};

export type CreateAdGroupInput = {
  campaignReference: string;
  adGroupName: string;
  dailyBudget?: number;
};

export type CreateTikTokAdvertisementInput = {
  campaignReference: string;
  adGroupReference: string;
  advertisementName: string;
  creativeReference?: string;
};

export type RetrieveTikTokPerformanceInput = {
  campaignReference?: string;
};

export type SyncTikTokCampaignStatusInput = {
  campaignReference?: string;
};

export type SyncTikTokAudienceInput = {
  campaignReference?: string;
  audienceName?: string;
};
