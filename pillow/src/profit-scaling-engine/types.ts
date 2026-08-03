/** PILLOW-PSE-001 — Profit Scaling Engine types (X3-17). */



import type {

  PROFIT_OPERATIONS,

  PROFIT_CATEGORIES,

  ENGINE_STATUSES,

  HEALTH_STATUSES,

  OPERATIONAL_STATES,

  PSE_CAPABILITIES,

  VALIDATION_STATUSES,

} from "./paths.js";

import type { ProfitScalingEngineConfiguration } from "./configuration.js";



export type ProfitScalingEngineVersion = "PILLOW-PSE-001";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ProfitOperation = (typeof PROFIT_OPERATIONS)[number];

export type ProfitCategory = (typeof PROFIT_CATEGORIES)[number];

export type PseCapability = (typeof PSE_CAPABILITIES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type HealthStatus = (typeof HEALTH_STATUSES)[number];



export type ProfitScalingRecord = {

  profitScalingId: string;

  timestamp: string;

  companyReference: string;

  profitCategory: ProfitCategory;

  grossMargin: number;

  netMargin: number;

  operatingMargin: number;

  profitOptimizationScore: number;

  recommendationSummary: string;

  validationStatus: ValidationStatus;

  metadataVersion: string;

  neverPrioritizeGrowthOverValidatedProfitability: true;

  structuralSignalOnly: true;

  sensitiveOperationalData: false;

  sensitiveFinancialData: false;

};



export type ProfitScalingEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: string;

  currentOperationalState: OperationalState;

  healthStatus: HealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: PseCapability[];

  frameworkModuleId: string | null;

  dependencyPresence: {

    autonomousScalingFramework: boolean;

    winningProductDetector: boolean;

    scalingDecisionEngine: boolean;

    capacityPlanningEngine: boolean;

    marketingScaleEngine: boolean;

    supplierScaleEngine: boolean;

    financialScaleEngine: boolean;

    workforceIntelligence: boolean;

    executiveScalingDashboard: boolean;

    bottleneckIntelligence: boolean;

    operationalElasticityEngine: boolean;

    performancePreservationEngine: boolean;

    scalingRiskMonitor: boolean;

    globalScalingPlanner: boolean;

    autonomousGrowthOptimizer: boolean;

    revenueAccelerationEngine: boolean;

  };

  metadataVersion: string;

};



export type ProfitScalingRecommendation = {

  recommendationId: string;

  timestamp: string;

  companyReference: string;

  profitCategory: ProfitCategory;

  recommendationSummary: string;

  profitOptimizationScore: number;

  grossMargin: number;

  netMargin: number;

  operatingMargin: number;

  structuralSignalOnly: true;

  neverPrioritizeGrowthOverValidatedProfitability: true;

};



export type ProfitValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



export type PseRunReport = {

  profitScalingEngineRunReportId: string;

  runTimestamp: string;

  action:

    | "connect"

    | "monitor_profit_growth"

    | "monitor_gross_margin"

    | "monitor_net_margin"

    | "monitor_operating_margin"

    | "monitor_scaling_costs"

    | "monitor_return_on_investment"

    | "detect_profit_erosion"

    | "detect_unprofitable_growth"

    | "optimize_profit_during_scaling"

    | "recommend_profit_scaling"

    | "diagnostics";

  engineRecord: ProfitScalingEngineRecord;

  profitScalingRecords: ProfitScalingRecord[];

  recommendations: ProfitScalingRecommendation[];

  validation: ProfitValidationReport;

  durationMs: number;

  metadataVersion: string;

};



export type PseHealthReport = {

  status: HealthStatus;

  healthScore: number;

  engineEnabled: boolean;

  lastOperationAt: string | null;

  lastValidationDecision: ProfitValidationReport["decision"] | null;

  consecutiveFailures: number;

  recoveryAttempts: number;

  totalProfitScalingRecords: number;

  highOptimizationCount: number;

  averageOptimizationScore: number;

  notes: string[];

};



export type PsePerformanceStats = {

  totalOperations: number;

  successfulOperations: number;

  failedOperations: number;

  monitoringRuns: number;

  erosionsDetected: number;

  unprofitableGrowthDetected: number;

  optimizationsPerformed: number;

  recommendationsGenerated: number;

  retryAttempts: number;

  averageOperationDurationMs: number;

  peakOperationDurationMs: number;

};



export type ProfitScalingEngineState = {

  engineVersion: ProfitScalingEngineVersion;

  missionId: "X3-17";

  status: EngineStatus;

  initializedAt: string;

  configuration: ProfitScalingEngineConfiguration;

  latestReport: PseRunReport | null;

  engineRecord: ProfitScalingEngineRecord | null;

  health: PseHealthReport;

  performance: PsePerformanceStats;

};



export type PseCockpitSnapshot = {

  engineStatus: EngineStatus;

  healthStatus: HealthStatus;

  operationalState: OperationalState | null;

  lastDecision: ProfitValidationReport["decision"] | null;

  totalProfitScalingRecords: number;

  highOptimizationCount: number;

  averageOptimizationScore: number;

  frameworkRegistered: boolean;

  dependenciesConnected: number;

  recentLogs: string[];

};



export type PseLogEntry = {

  logId: string;

  timestamp: string;

  event: string;

  level: "debug" | "info" | "warn" | "error";

  details: string;

};



export type ConnectProfitScalingEngineInput = Record<string, unknown>;



export type ProfitScalingInput = {

  companyReference?: string;

  profitCategoryHint?: ProfitCategory;

  profitOptimizationHint?: number;

  grossMarginHint?: number;

  netMarginHint?: number;

  operatingMarginHint?: number;

  validated?: boolean;

};



export type RunPseDiagnosticsInput = Record<string, unknown>;

