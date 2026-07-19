/** PILLOW-MAI-001 — Meta Ads Integration types (R5-02). */

import type {
  AUTHENTICATION_STATUSES,
  CAMPAIGN_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MAI_CAPABILITIES,
  OPERATIONAL_STATES,
  SYNCHRONIZATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";

export type MetaAdsIntegrationEngineVersion = "PILLOW-MAI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type MaiCapability = (typeof MAI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type MetaEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  integrationId: string;
  integrationVersion: string;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: MaiCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
  businessAccountId: string | null;
  adAccountId: string | null;
};

export type MetaAdsRecord = {
  metaRecordId: string;
  timestamp: string;
  businessAccountId: string;
  adAccountId: string;
  campaignReference: string;
  adSetReference: string | null;
  advertisementReference: string | null;
  campaignStatus: CampaignStatus;
  synchronizationStatus: SynchronizationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
};

export type MetaAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type MetaConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type MetaValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MetaAdsRunReport = {
  metaRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_business_account"
    | "manage_ad_account"
    | "create_campaign"
    | "create_ad_set"
    | "create_advertisement"
    | "retrieve_performance"
    | "sync_campaign_status";
  engineRecord: MetaEngineRecord;
  metaRecords: MetaAdsRecord[];
  validation: MetaValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MetaHealthReport = {
  status: HealthStatus;
  healthScore: number;
  integrationEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: MetaValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaigns: number;
  notes: string[];
};

export type MetaPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  campaignsCreated: number;
  adSetsCreated: number;
  advertisementsCreated: number;
  performanceRetrievals: number;
  statusSyncs: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type MetaLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MetaAdsIntegrationState = {
  engineVersion: MetaAdsIntegrationEngineVersion;
  missionId: "R5-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: MetaAdsIntegrationConfiguration;
  latestReport: MetaAdsRunReport | null;
  engineRecord: MetaEngineRecord | null;
  health: MetaHealthReport;
  performance: MetaPerformanceStats;
};

export type MetaCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: MetaValidationReport["decision"] | null;
  campaignsCreated: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectMetaAdsInput = {
  credentialRef?: string;
  businessAccountId?: string;
  adAccountId?: string;
  forceReconnect?: boolean;
};

export type ManageBusinessAccountInput = {
  businessAccountId?: string;
  businessName?: string;
};

export type ManageAdAccountInput = {
  adAccountId?: string;
  businessAccountId?: string;
  currency?: string;
};

export type CreateCampaignInput = {
  campaignName: string;
  businessAccountId?: string;
  adAccountId?: string;
  objective?: string;
};

export type CreateAdSetInput = {
  campaignReference: string;
  adSetName: string;
  dailyBudget?: number;
};

export type CreateAdvertisementInput = {
  campaignReference: string;
  adSetReference: string;
  advertisementName: string;
  creativeReference?: string;
};

export type RetrievePerformanceInput = {
  campaignReference?: string;
};

export type SyncCampaignStatusInput = {
  campaignReference?: string;
};
