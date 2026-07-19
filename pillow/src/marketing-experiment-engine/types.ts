/** PILLOW-MEE-001 — Marketing Experiment Engine types (R5-17). */

import type {
  ENGINE_STATUSES,
  EXPERIMENT_STATUSES,
  EXPERIMENT_TYPES,
  HEALTH_STATUSES,
  MEE_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketingExperimentEngineConfiguration } from "./configuration.js";

export type MarketingExperimentEngineVersion = "PILLOW-MEE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];
export type ExperimentType = (typeof EXPERIMENT_TYPES)[number];
export type MeeCapability = (typeof MEE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ExperimentPerformanceMetrics = {
  impressions: number;
  conversions: number;
  conversionRate: number;
  sampleSize: number;
  confidence: number;
};

export type ExperimentEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MeeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    campaignManager: boolean;
    audienceIntelligence: boolean;
    attributionEngine: boolean;
    marketingAnalyticsDashboard: boolean;
    aiCampaignGenerator: boolean;
    budgetOptimizationEngine: boolean;
    conversionIntelligence: boolean;
    viralTrendIntelligence: boolean;
  };
  metadataVersion: string;
};

export type ExperimentRecord = {
  experimentId: string;
  timestamp: string;
  experimentName: string;
  experimentType: ExperimentType;
  campaignReference: string | null;
  variantReferences: string[];
  audienceReference: string | null;
  performanceMetrics: ExperimentPerformanceMetrics;
  winningVariant: string | null;
  statisticallySignificant: boolean;
  experimentStatus: ExperimentStatus;
  recommendationSummary: string;
  deployedToProduction: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ExperimentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExperimentRunReport = {
  experimentRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_experiment"
    | "manage_ab_test"
    | "manage_multivariate_test"
    | "assign_audience"
    | "measure_performance"
    | "compare_variants"
    | "detect_significance"
    | "recommend_winner"
    | "archive_experiment";
  engineRecord: ExperimentEngineRecord;
  experimentRecords: ExperimentRecord[];
  validation: ExperimentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExperimentHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExperimentValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalExperimentRecords: number;
  runningExperiments: number;
  notes: string[];
};

export type ExperimentPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  experimentsCreated: number;
  significanceChecks: number;
  winnersRecommended: number;
  archivesRun: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExperimentLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketingExperimentEngineState = {
  engineVersion: MarketingExperimentEngineVersion;
  missionId: "R5-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketingExperimentEngineConfiguration;
  latestReport: ExperimentRunReport | null;
  engineRecord: ExperimentEngineRecord | null;
  health: ExperimentHealthReport;
  performance: ExperimentPerformanceStats;
};

export type ExperimentCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ExperimentValidationReport["decision"] | null;
  totalExperimentRecords: number;
  runningExperiments: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectMarketingExperimentEngineInput = {
  forceReconnect?: boolean;
};

export type CreateExperimentInput = {
  experimentName?: string;
  experimentType?: ExperimentType;
  campaignReference?: string;
  variants?: string[];
  audienceReference?: string;
  validated?: boolean;
};

export type ManageExperimentInput = {
  experimentId?: string;
  variants?: string[];
};

export type AssignAudienceInput = {
  experimentId?: string;
  audienceReference?: string;
  splitPercent?: number;
};

export type AnalyzeExperimentInput = {
  experimentId?: string;
};

export type ArchiveExperimentInput = {
  experimentId?: string;
  validated?: boolean;
};
