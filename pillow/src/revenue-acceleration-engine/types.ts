/** PILLOW-RAE-001 — Revenue Acceleration Engine types (X3-16). */

import type {
  REVENUE_OPERATIONS,
  REVENUE_CATEGORIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RAE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";

export type RevenueAccelerationEngineVersion = "PILLOW-RAE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RevenueOperation = (typeof REVENUE_OPERATIONS)[number];
export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number];
export type RaeCapability = (typeof RAE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RevenueAccelerationRecord = {
  revenueAccelerationId: string;
  timestamp: string;
  companyReference: string;
  revenueCategory: RevenueCategory;
  currentRevenueMetrics: string;
  revenueOpportunityScore: number;
  expectedRevenueIncrease: string;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverRecommendWithoutValidatedSupportingData: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
  sensitiveFinancialData: false;
};

export type RevenueAccelerationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RaeCapability[];
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
  };
  metadataVersion: string;
};

export type RevenueAccelerationRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  revenueCategory: RevenueCategory;
  recommendationSummary: string;
  revenueOpportunityScore: number;
  expectedRevenueIncrease: string;
  structuralSignalOnly: true;
  neverRecommendWithoutValidatedSupportingData: true;
};

export type RevenueValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RaeRunReport = {
  revenueAccelerationEngineRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_revenue_growth"
    | "monitor_revenue_trends"
    | "monitor_product_revenue"
    | "monitor_channel_revenue"
    | "monitor_customer_revenue"
    | "identify_revenue_acceleration_opportunities"
    | "identify_revenue_bottlenecks"
    | "optimize_revenue_strategies"
    | "rank_revenue_opportunities"
    | "recommend_revenue_acceleration"
    | "diagnostics";
  engineRecord: RevenueAccelerationEngineRecord;
  revenueAccelerationRecords: RevenueAccelerationRecord[];
  recommendations: RevenueAccelerationRecommendation[];
  validation: RevenueValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RaeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RevenueValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalRevenueAccelerationRecords: number;
  highOpportunityCount: number;
  averageOpportunityScore: number;
  notes: string[];
};

export type RaePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  opportunitiesIdentified: number;
  bottlenecksIdentified: number;
  strategiesOptimized: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RevenueAccelerationEngineState = {
  engineVersion: RevenueAccelerationEngineVersion;
  missionId: "X3-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: RevenueAccelerationEngineConfiguration;
  latestReport: RaeRunReport | null;
  engineRecord: RevenueAccelerationEngineRecord | null;
  health: RaeHealthReport;
  performance: RaePerformanceStats;
};

export type RaeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: RevenueValidationReport["decision"] | null;
  totalRevenueAccelerationRecords: number;
  highOpportunityCount: number;
  averageOpportunityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type RaeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectRevenueAccelerationEngineInput = Record<string, unknown>;

export type RevenueAccelerationInput = {
  companyReference?: string;
  revenueCategoryHint?: RevenueCategory;
  revenueOpportunityHint?: number;
  currentRevenueMetricsHint?: string;
  expectedRevenueIncreaseHint?: string;
  validated?: boolean;
};

export type RunRaeDiagnosticsInput = Record<string, unknown>;
