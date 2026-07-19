/** PILLOW-GAI-001 — Google Ads Integration types (R5-03). */

import type {
  AUTHENTICATION_STATUSES,
  CAMPAIGN_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  GAI_CAPABILITIES,
  OPERATIONAL_STATES,
  SYNCHRONIZATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";

export type GoogleAdsIntegrationEngineVersion = "PILLOW-GAI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type SynchronizationStatus = (typeof SYNCHRONIZATION_STATUSES)[number];
export type GaiCapability = (typeof GAI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type GoogleAdsEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  integrationId: string;
  integrationVersion: string;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: GaiCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
  customerAccountId: string | null;
  advertisingAccountId: string | null;
};

export type GoogleAdsRecord = {
  googleAdsRecordId: string;
  timestamp: string;
  customerAccountId: string;
  campaignReference: string;
  adGroupReference: string | null;
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

export type GoogleAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type GoogleConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type GoogleAdsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type GoogleAdsRunReport = {
  googleAdsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_customer_account"
    | "manage_advertising_account"
    | "create_campaign"
    | "create_ad_group"
    | "create_advertisement"
    | "retrieve_performance"
    | "sync_campaign_status";
  engineRecord: GoogleAdsEngineRecord;
  googleAdsRecords: GoogleAdsRecord[];
  validation: GoogleAdsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GoogleAdsHealthReport = {
  status: HealthStatus;
  healthScore: number;
  integrationEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: GoogleAdsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaigns: number;
  notes: string[];
};

export type GoogleAdsPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  campaignsCreated: number;
  adGroupsCreated: number;
  advertisementsCreated: number;
  performanceRetrievals: number;
  statusSyncs: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GoogleAdsLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type GoogleAdsIntegrationState = {
  engineVersion: GoogleAdsIntegrationEngineVersion;
  missionId: "R5-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: GoogleAdsIntegrationConfiguration;
  latestReport: GoogleAdsRunReport | null;
  engineRecord: GoogleAdsEngineRecord | null;
  health: GoogleAdsHealthReport;
  performance: GoogleAdsPerformanceStats;
};

export type GoogleAdsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: GoogleAdsValidationReport["decision"] | null;
  campaignsCreated: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectGoogleAdsInput = {
  credentialRef?: string;
  customerAccountId?: string;
  advertisingAccountId?: string;
  forceReconnect?: boolean;
};

export type ManageCustomerAccountInput = {
  customerAccountId?: string;
  customerName?: string;
};

export type ManageAdvertisingAccountInput = {
  advertisingAccountId?: string;
  customerAccountId?: string;
  currency?: string;
};

export type CreateGoogleCampaignInput = {
  campaignName: string;
  customerAccountId?: string;
  advertisingAccountId?: string;
  objective?: string;
};

export type CreateAdGroupInput = {
  campaignReference: string;
  adGroupName: string;
  dailyBudget?: number;
};

export type CreateGoogleAdvertisementInput = {
  campaignReference: string;
  adGroupReference: string;
  advertisementName: string;
  creativeReference?: string;
};

export type RetrieveGooglePerformanceInput = {
  campaignReference?: string;
};

export type SyncGoogleCampaignStatusInput = {
  campaignReference?: string;
};
