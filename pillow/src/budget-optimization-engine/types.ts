/** PILLOW-BOE-001 — Budget Optimization Engine types (R5-13). */

import type {
  BOE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";

export type BudgetOptimizationEngineVersion = "PILLOW-BOE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type BoeCapability = (typeof BOE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BudgetEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BoeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    campaignManager: boolean;
    audienceIntelligence: boolean;
    attributionEngine: boolean;
    marketingAnalyticsDashboard: boolean;
    aiCampaignGenerator: boolean;
  };
  metadataVersion: string;
};

export type BudgetRecord = {
  budgetRecordId: string;
  timestamp: string;
  campaignReference: string | null;
  marketingChannel: MarketingChannel;
  allocatedBudget: number;
  currentSpend: number;
  remainingBudget: number;
  budgetUtilization: number;
  efficiencyScore: number;
  overspendDetected: boolean;
  inefficiencyDetected: boolean;
  optimizationRecommendation: string;
  appliedToActiveCampaign: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BudgetValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BudgetRunReport = {
  budgetRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "allocate_budget"
    | "reallocate_budget"
    | "monitor_spend"
    | "monitor_utilization"
    | "detect_inefficiencies"
    | "detect_overspend"
    | "calculate_efficiency"
    | "recommend_adjustments"
    | "optimize_budgets";
  engineRecord: BudgetEngineRecord;
  budgetRecords: BudgetRecord[];
  validation: BudgetValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BudgetHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BudgetValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBudgetRecords: number;
  averageUtilization: number;
  notes: string[];
};

export type BudgetPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  allocationsRun: number;
  reallocationsRun: number;
  optimizationsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BudgetLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BudgetOptimizationEngineState = {
  engineVersion: BudgetOptimizationEngineVersion;
  missionId: "R5-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: BudgetOptimizationEngineConfiguration;
  latestReport: BudgetRunReport | null;
  engineRecord: BudgetEngineRecord | null;
  health: BudgetHealthReport;
  performance: BudgetPerformanceStats;
};

export type BudgetCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BudgetValidationReport["decision"] | null;
  totalBudgetRecords: number;
  averageUtilization: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBudgetOptimizationInput = {
  forceReconnect?: boolean;
};

export type AllocateBudgetInput = {
  campaignReference?: string;
  marketingChannel: MarketingChannel;
  allocatedBudget: number;
  currentSpend?: number;
};

export type ReallocateBudgetInput = {
  budgetRecordId?: string;
  totalBudget?: number;
  channels?: MarketingChannel[];
};

export type OptimizeBudgetsInput = {
  campaignReference?: string;
  validated?: boolean;
};

export type MonitorSpendInput = {
  budgetRecordId?: string;
};

export type RecommendAdjustmentsInput = {
  budgetRecordId?: string;
};
