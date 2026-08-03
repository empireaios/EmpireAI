/** PILLOW-SBE-001 — Self-Balancing Enterprise types (X3-19). */

import type {
  BALANCE_OPERATIONS,
  RESOURCE_CATEGORIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SBE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";

export type SelfBalancingEnterpriseVersion = "PILLOW-SBE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type BalanceOperation = (typeof BALANCE_OPERATIONS)[number];
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type SbeCapability = (typeof SBE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type SelfBalancingRecord = {
  enterpriseBalanceId: string;
  timestamp: string;
  companyReference: string;
  resourceCategory: ResourceCategory | string;
  currentAllocation: number;
  recommendedAllocation: number;
  balanceScore: number;
  expectedImprovement: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverReallocateProtectedResourcesBeyondApprovalPolicies: true;
  structuralSignalOnly: true;
  policyGatedReallocation: true;
  sensitiveOperationalData: false;
};

export type SelfBalancingEnterpriseRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SbeCapability[];
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
    profitScalingEngine: boolean;
    scaleSimulationEngine: boolean;
  };
  metadataVersion: string;
};

export type SelfBalancingRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  resourceCategory: string;
  recommendationSummary: string;
  balanceScore: number;
  currentAllocation: number;
  recommendedAllocation: number;
  expectedImprovement: string;
  structuralSignalOnly: true;
  neverReallocateProtectedResourcesBeyondApprovalPolicies: true;
  policyGatedReallocation: true;
};

export type BalanceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SbeRunReport = {
  selfBalancingEnterpriseRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_enterprise_resource_utilization"
    | "monitor_operational_balance"
    | "monitor_financial_balance"
    | "monitor_workforce_balance"
    | "monitor_supplier_balance"
    | "monitor_infrastructure_balance"
    | "detect_resource_imbalances"
    | "reallocate_resources_per_policy"
    | "optimize_enterprise_equilibrium"
    | "recommend_balancing_actions"
    | "diagnostics";
  engineRecord: SelfBalancingEnterpriseRecord;
  balancingRecords: SelfBalancingRecord[];
  recommendations: SelfBalancingRecommendation[];
  validation: BalanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SbeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BalanceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBalancingRecords: number;
  highScoreCount: number;
  averageBalanceScore: number;
  notes: string[];
};

export type SbePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  reallocationsPerformed: number;
  optimizationsPerformed: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SelfBalancingEnterpriseState = {
  engineVersion: SelfBalancingEnterpriseVersion;
  missionId: "X3-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: SelfBalancingEnterpriseConfiguration;
  latestReport: SbeRunReport | null;
  engineRecord: SelfBalancingEnterpriseRecord | null;
  health: SbeHealthReport;
  performance: SbePerformanceStats;
};

export type SbeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BalanceValidationReport["decision"] | null;
  totalBalancingRecords: number;
  highScoreCount: number;
  averageBalanceScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type SbeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectSelfBalancingEnterpriseInput = Record<string, unknown>;

export type SelfBalancingInput = {
  companyReference?: string;
  resourceCategoryHint?: ResourceCategory | string;
  currentAllocationHint?: number;
  recommendedAllocationHint?: number;
  balanceScoreHint?: number;
  validated?: boolean;
  /** Forbidden — never bypass approval for protected resources. */
  bypassApprovalPolicies?: boolean;
  /** Forbidden — structural recommendations only; no production mutation. */
  mutateProductionResources?: boolean;
};

export type RunSbeDiagnosticsInput = Record<string, unknown>;
