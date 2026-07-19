/** PILLOW-BMG-001 — Budget Management Engine types (R3-14). */

import type {
  BMG_CAPABILITIES,
  BUDGET_CATEGORIES,
  BUDGET_PERIODS,
  BUDGET_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BudgetManagementEngineConfiguration } from "./configuration.js";

export type BudgetManagementEngineVersion = "PILLOW-BMG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];
export type BmgCapability = (typeof BMG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BudgetManagementEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BmgCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  cashFlowMonitorConnected: boolean;
  financialForecastEngineConnected: boolean;
};

export type BudgetRecord = {
  budgetRecordId: string;
  timestamp: string;
  budgetPeriod: string;
  budgetCategory: string;
  budgetAllocation: number;
  actualExpenditure: number;
  remainingBudget: number;
  budgetVariance: number;
  budgetUtilizationPercentage: number;
  budgetStatus: BudgetStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BudgetVariance = {
  varianceId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  budgetRecordId: string | null;
  varianceAmount: number;
  variancePercent: number;
};

export type BudgetOverrun = {
  overrunId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  budgetRecordId: string | null;
  overrunAmount: number;
};

export type BudgetRecommendation = {
  recommendationId: string;
  timestamp: string;
  priority: "low" | "medium" | "high";
  description: string;
  budgetRecordId: string | null;
  suggestedAction: string;
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

export type BudgetManagementRunReport = {
  budgetRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_budget"
    | "allocate_budget"
    | "track_utilization"
    | "compare_actual"
    | "detect_overruns"
    | "detect_variances"
    | "generate_recommendations";
  engineRecord: BudgetManagementEngineRecord;
  budgetRecords: BudgetRecord[];
  variances: BudgetVariance[];
  overruns: BudgetOverrun[];
  recommendations: BudgetRecommendation[];
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
  lastUtilizationPercentage: number | null;
  notes: string[];
};

export type BudgetPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  budgetsCreated: number;
  allocationsManaged: number;
  utilizationsTracked: number;
  variancesDetected: number;
  overrunsDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BmgLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BudgetManagementEngineState = {
  engineVersion: BudgetManagementEngineVersion;
  missionId: "R3-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: BudgetManagementEngineConfiguration;
  latestReport: BudgetManagementRunReport | null;
  engineRecord: BudgetManagementEngineRecord | null;
  health: BudgetHealthReport;
  performance: BudgetPerformanceStats;
};

export type BudgetCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: BudgetValidationReport["decision"] | null;
  totalBudgetRecords: number;
  lastUtilizationPercentage: number | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectBudgetManagementEngineInput = {
  forceReconnect?: boolean;
};

export type CreateBudgetInput = {
  budgetPeriod?: BudgetPeriod;
  budgetCategory?: BudgetCategory;
  budgetAllocation: number;
};

export type AllocateBudgetInput = {
  budgetRecordId: string;
  additionalAllocation: number;
};

export type TrackBudgetUtilizationInput = {
  budgetRecordId?: string;
};

export type CompareActualVsBudgetInput = {
  budgetRecordId?: string;
};

export type DetectBudgetOverrunsInput = {
  budgetRecordId?: string;
};

export type DetectBudgetVariancesInput = {
  budgetRecordId?: string;
};

export type GenerateBudgetRecommendationsInput = {
  budgetRecordId?: string;
};
