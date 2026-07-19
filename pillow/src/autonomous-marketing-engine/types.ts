/** PILLOW-AME-001 — Autonomous Marketing Engine types (R5-19). */

import type {
  AME_CAPABILITIES,
  ENGINE_STATUSES,
  EXECUTION_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPTIMIZATION_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AutonomousMarketingEngineConfiguration } from "./configuration.js";

export type AutonomousMarketingEngineVersion = "PILLOW-AME-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type AmeCapability = (typeof AME_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AutonomousMarketingEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AmeCapability[];
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
    aiCampaignGenerator: boolean;
    budgetOptimizationEngine: boolean;
    conversionIntelligence: boolean;
    competitorMarketingMonitor: boolean;
    viralTrendIntelligence: boolean;
    marketingExperimentEngine: boolean;
    crossChannelOrchestrator: boolean;
  };
  metadataVersion: string;
};

export type AutonomousMarketingRecord = {
  autonomousMarketingId: string;
  timestamp: string;
  campaignReference: string | null;
  optimizationCategory: OptimizationCategory;
  triggerEvent: string;
  recommendedAction: string;
  executedAction: string | null;
  executionStatus: ExecutionStatus;
  /** High-impact live execution is never performed by this structural engine. */
  highImpactExecuted: false;
  approvalGranted: boolean;
  confidenceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type AutonomousMarketingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousMarketingRunReport = {
  autonomousMarketingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_performance"
    | "generate_recommendations"
    | "optimize_budgets"
    | "optimize_audience"
    | "optimize_scheduling"
    | "optimize_creative"
    | "optimize_channel_allocation"
    | "respond_to_performance_changes"
    | "execute_approved_optimizations";
  engineRecord: AutonomousMarketingEngineRecord;
  autonomousMarketingRecords: AutonomousMarketingRecord[];
  validation: AutonomousMarketingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousMarketingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AutonomousMarketingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAutonomousRecords: number;
  pendingApprovals: number;
  notes: string[];
};

export type AutonomousMarketingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  recommendationsGenerated: number;
  optimizationsRun: number;
  approvedExecutions: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AutonomousMarketingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AutonomousMarketingEngineState = {
  engineVersion: AutonomousMarketingEngineVersion;
  missionId: "R5-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousMarketingEngineConfiguration;
  latestReport: AutonomousMarketingRunReport | null;
  engineRecord: AutonomousMarketingEngineRecord | null;
  health: AutonomousMarketingHealthReport;
  performance: AutonomousMarketingPerformanceStats;
};

export type AutonomousMarketingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AutonomousMarketingValidationReport["decision"] | null;
  totalAutonomousRecords: number;
  pendingApprovals: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectAutonomousMarketingEngineInput = {
  forceReconnect?: boolean;
};

export type MonitorPerformanceInput = {
  campaignReference?: string;
  validated?: boolean;
};

export type AutonomousMarketingActionInput = {
  autonomousMarketingId?: string;
  campaignReference?: string;
  approved?: boolean;
  validated?: boolean;
};
