/** PILLOW-ACG-001 — AI Campaign Generator types (R5-12). */

import type {
  ACG_CAPABILITIES,
  CAMPAIGN_OBJECTIVES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AiCampaignGeneratorConfiguration } from "./configuration.js";

export type AiCampaignGeneratorEngineVersion = "PILLOW-ACG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type AcgCapability = (typeof ACG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AiCampaignEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AcgCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    seoIntelligence: boolean;
    campaignManager: boolean;
    audienceIntelligence: boolean;
    attributionEngine: boolean;
    marketingAnalyticsDashboard: boolean;
    creativeAssetManager: boolean;
  };
  metadataVersion: string;
};

export type CampaignScheduleRecommendation = {
  startDate: string;
  endDate: string;
  durationDays: number;
  pacing: "even" | "front_loaded" | "back_loaded";
};

export type AiCampaignRecord = {
  aiCampaignId: string;
  timestamp: string;
  campaignObjective: CampaignObjective;
  strategySummary: string;
  recommendedChannels: MarketingChannel[];
  recommendedAudience: string;
  recommendedBudget: number;
  recommendedSchedule: CampaignScheduleRecommendation;
  recommendedKeywords: string[];
  recommendedCreativeAssets: string[];
  campaignSummary: string;
  publishReady: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type AiCampaignValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AiCampaignRunReport = {
  aiCampaignRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "generate_strategy"
    | "generate_objective"
    | "recommend_channels"
    | "recommend_audience"
    | "recommend_budget"
    | "recommend_schedule"
    | "recommend_keywords"
    | "recommend_creatives"
    | "generate_campaign"
    | "generate_summary";
  engineRecord: AiCampaignEngineRecord;
  campaignRecords: AiCampaignRecord[];
  validation: AiCampaignValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AiCampaignHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AiCampaignValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCampaignsGenerated: number;
  notes: string[];
};

export type AiCampaignPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  campaignsGenerated: number;
  strategiesGenerated: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AiCampaignLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AiCampaignGeneratorState = {
  engineVersion: AiCampaignGeneratorEngineVersion;
  missionId: "R5-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: AiCampaignGeneratorConfiguration;
  latestReport: AiCampaignRunReport | null;
  engineRecord: AiCampaignEngineRecord | null;
  health: AiCampaignHealthReport;
  performance: AiCampaignPerformanceStats;
};

export type AiCampaignCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AiCampaignValidationReport["decision"] | null;
  campaignsGenerated: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectAiCampaignGeneratorInput = {
  forceReconnect?: boolean;
};

export type GenerateCampaignInput = {
  objective?: CampaignObjective;
  productFocus?: string;
  budgetUsd?: number;
  durationDays?: number;
  preferredChannels?: MarketingChannel[];
};

export type GenerateStrategyInput = {
  objective?: CampaignObjective;
  productFocus?: string;
};

export type RecommendInput = {
  aiCampaignId?: string;
  objective?: CampaignObjective;
  productFocus?: string;
  budgetUsd?: number;
  durationDays?: number;
};
