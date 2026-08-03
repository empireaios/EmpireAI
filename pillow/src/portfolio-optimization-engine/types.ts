/** PILLOW-POE-001 — Portfolio Optimization Engine types (X2-16). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_PRIORITIES,
  POE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";

export type PortfolioOptimizationEngineVersion = "PILLOW-POE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PoeCapability = (typeof POE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];
export type OptimizationPriority = (typeof OPTIMIZATION_PRIORITIES)[number];

export type PortfolioOptimizationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PoeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    portfolioRiskEngine: boolean;
    portfolioBalanceEngine: boolean;
    businessHealthRanking: boolean;
    sharedCustomerIntelligence: boolean;
    sharedSupplierIntelligence: boolean;
    portfolioForecastEngine: boolean;
    acquisitionEvaluationEngine: boolean;
  };
  metadataVersion: string;
};

export type OptimizationRecord = {
  portfolioOptimizationId: string;
  timestamp: string;
  portfolioReference: string;
  optimizationCategory: OptimizationCategory;
  optimizationOpportunity: string;
  expectedBenefit: number;
  optimizationPriority: OptimizationPriority;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  rankedPosition: number | null;
  requiresApproval: boolean;
  autoExecutionBlocked: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type OptimizationRecommendation = {
  recommendationId: string;
  timestamp: string;
  portfolioReference: string;
  optimizationCategory: OptimizationCategory;
  recommendationSummary: string;
  expectedBenefit: number;
  priority: OptimizationPriority;
  requiresApproval: boolean;
  autoExecutionBlocked: true;
  structuralSignalOnly: true;
};

export type OptimizationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OptimizationRunReport = {
  optimizationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "optimize_enterprise_performance"
    | "optimize_capital_allocation"
    | "optimize_resource_utilization"
    | "optimize_company_priorities"
    | "optimize_operational_efficiency"
    | "optimize_portfolio_balance"
    | "detect_opportunities"
    | "rank_priorities"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: PortfolioOptimizationEngineRecord;
  optimizationRecords: OptimizationRecord[];
  recommendations: OptimizationRecommendation[];
  validation: OptimizationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OptimizationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: OptimizationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalOptimizationRecords: number;
  highPriorityOpportunities: number;
  averageExpectedBenefit: number;
  notes: string[];
};

export type OptimizationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  performanceOptimizations: number;
  capitalOptimizations: number;
  resourceOptimizations: number;
  priorityOptimizations: number;
  operationalOptimizations: number;
  balanceOptimizations: number;
  opportunitiesDetected: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type OptimizationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioOptimizationEngineState = {
  engineVersion: PortfolioOptimizationEngineVersion;
  missionId: "X2-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioOptimizationEngineConfiguration;
  latestReport: OptimizationRunReport | null;
  engineRecord: PortfolioOptimizationEngineRecord | null;
  health: OptimizationHealthReport;
  performance: OptimizationPerformanceStats;
};

export type OptimizationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: OptimizationValidationReport["decision"] | null;
  totalOptimizationRecords: number;
  highPriorityOpportunities: number;
  averageExpectedBenefit: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioOptimizationEngineInput = {
  forceReconnect?: boolean;
};

export type OptimizePortfolioInput = {
  portfolioReference?: string;
  expectedBenefitHint?: number;
  opportunityHint?: string;
  validated?: boolean;
};

export type DetectOptimizationOpportunitiesInput = {
  portfolioReference?: string;
  categories?: OptimizationCategory[];
  validated?: boolean;
};

export type RankOptimizationPrioritiesInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type GenerateOptimizationRecommendationsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type RunOptimizationDiagnosticsInput = {
  portfolioReference?: string;
};
