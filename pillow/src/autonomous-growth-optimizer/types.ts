/** PILLOW-AGO-001 — Autonomous Growth Optimizer types (X3-15). */

import type {
  GROWTH_OPERATIONS,
  GROWTH_CATEGORIES,
  OPTIMIZATION_PRIORITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  AGO_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";

export type AutonomousGrowthOptimizerVersion = "PILLOW-AGO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type GrowthOperation = (typeof GROWTH_OPERATIONS)[number];
export type GrowthCategory = (typeof GROWTH_CATEGORIES)[number];
export type OptimizationPriority = (typeof OPTIMIZATION_PRIORITIES)[number];
export type AgoCapability = (typeof AGO_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type GrowthOptimizationRecord = {
  growthOptimizationId: string;
  timestamp: string;
  companyReference: string;
  growthCategory: GrowthCategory;
  currentGrowthMetrics: string;
  growthOpportunityScore: number;
  optimizationPriority: OptimizationPriority;
  expectedGrowthImpact: string;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverOptimizeBeyondValidatedOperationalLimits: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type AutonomousGrowthOptimizerRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AgoCapability[];
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
  };
  metadataVersion: string;
};

export type AutonomousGrowthRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  growthCategory: GrowthCategory;
  recommendationSummary: string;
  optimizationPriority: OptimizationPriority;
  growthOpportunityScore: number;
  expectedGrowthImpact: string;
  structuralSignalOnly: true;
  neverOptimizeBeyondValidatedOperationalLimits: true;
};

export type GrowthValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AgoRunReport = {
  autonomousGrowthOptimizerRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_enterprise_growth"
    | "monitor_revenue_growth"
    | "monitor_profit_growth"
    | "monitor_customer_growth"
    | "monitor_operational_growth"
    | "identify_growth_opportunities"
    | "identify_growth_constraints"
    | "optimize_growth_strategies"
    | "rank_growth_priorities"
    | "recommend_autonomous_growth"
    | "diagnostics";
  engineRecord: AutonomousGrowthOptimizerRecord;
  growthOptimizationRecords: GrowthOptimizationRecord[];
  recommendations: AutonomousGrowthRecommendation[];
  validation: GrowthValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AgoHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: GrowthValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalGrowthOptimizationRecords: number;
  highPriorityCount: number;
  averageOpportunityScore: number;
  notes: string[];
};

export type AgoPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  opportunitiesIdentified: number;
  constraintsIdentified: number;
  strategiesOptimized: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AutonomousGrowthOptimizerState = {
  engineVersion: AutonomousGrowthOptimizerVersion;
  missionId: "X3-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousGrowthOptimizerConfiguration;
  latestReport: AgoRunReport | null;
  engineRecord: AutonomousGrowthOptimizerRecord | null;
  health: AgoHealthReport;
  performance: AgoPerformanceStats;
};

export type AgoCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: GrowthValidationReport["decision"] | null;
  totalGrowthOptimizationRecords: number;
  highPriorityCount: number;
  averageOpportunityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type AgoLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectAutonomousGrowthOptimizerInput = Record<string, unknown>;

export type GrowthOptimizationInput = {
  companyReference?: string;
  growthCategoryHint?: GrowthCategory;
  growthOpportunityHint?: number;
  optimizationPriorityHint?: OptimizationPriority;
  currentGrowthMetricsHint?: string;
  expectedGrowthImpactHint?: string;
  validated?: boolean;
};

export type RunAgoDiagnosticsInput = Record<string, unknown>;
