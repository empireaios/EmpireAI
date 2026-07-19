/** PILLOW-CCO-001 — Cross-Channel Orchestrator types (R5-18). */

import type {
  CCO_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  SYNC_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";

export type CrossChannelOrchestratorVersion = "PILLOW-CCO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type SyncStatus = (typeof SYNC_STATUSES)[number];
export type CcoCapability = (typeof CCO_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type OrchestrationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CcoCapability[];
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
    aiCampaignGenerator: boolean;
    budgetOptimizationEngine: boolean;
    conversionIntelligence: boolean;
    competitorMarketingMonitor: boolean;
    viralTrendIntelligence: boolean;
    marketingExperimentEngine: boolean;
  };
  metadataVersion: string;
};

export type OrchestrationRecord = {
  orchestrationId: string;
  timestamp: string;
  campaignReference: string | null;
  marketingChannels: MarketingChannel[];
  campaignSchedule: string;
  synchronizationStatus: SyncStatus;
  journeyCoordinationStatus: SyncStatus;
  conflictStatus: "none" | "detected" | "resolved";
  conflictSummary: string;
  recommendationSummary: string;
  launchedToProduction: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type OrchestrationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OrchestrationRunReport = {
  orchestrationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "coordinate_campaigns"
    | "synchronize_execution"
    | "synchronize_schedules"
    | "coordinate_journeys"
    | "coordinate_channels"
    | "coordinate_budgets"
    | "coordinate_assets"
    | "coordinate_experiments"
    | "detect_conflicts";
  engineRecord: OrchestrationEngineRecord;
  orchestrationRecords: OrchestrationRecord[];
  validation: OrchestrationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OrchestrationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: OrchestrationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalOrchestrationRecords: number;
  conflictedOrchestrations: number;
  notes: string[];
};

export type OrchestrationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  coordinationsRun: number;
  synchronizationsRun: number;
  conflictsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type OrchestrationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CrossChannelOrchestratorState = {
  engineVersion: CrossChannelOrchestratorVersion;
  missionId: "R5-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrossChannelOrchestratorConfiguration;
  latestReport: OrchestrationRunReport | null;
  engineRecord: OrchestrationEngineRecord | null;
  health: OrchestrationHealthReport;
  performance: OrchestrationPerformanceStats;
};

export type OrchestrationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: OrchestrationValidationReport["decision"] | null;
  totalOrchestrationRecords: number;
  conflictedOrchestrations: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCrossChannelOrchestratorInput = {
  forceReconnect?: boolean;
};

export type CoordinateCampaignsInput = {
  campaignReference?: string;
  marketingChannels?: MarketingChannel[];
  schedule?: string;
  validated?: boolean;
};

export type OrchestrationActionInput = {
  orchestrationId?: string;
  campaignReference?: string;
  marketingChannels?: MarketingChannel[];
};
