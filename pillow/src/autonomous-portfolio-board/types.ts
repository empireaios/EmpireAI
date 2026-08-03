/** PILLOW-APB-001 — Autonomous Portfolio Board types (X2-20). */

import type {
  APB_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PRIORITY_LEVELS,
  REVIEW_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";

export type AutonomousPortfolioBoardVersion = "PILLOW-APB-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ApbCapability = (typeof APB_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export type ExecutiveBoardRecord = {
  executiveBoardId: string;
  timestamp: string;
  portfolioReference: string;
  strategicIssues: string[];
  executivePriorities: string[];
  recommendedDecisions: string[];
  expectedEnterpriseImpact: string;
  decisionConfidence: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  reviewCategory: ReviewCategory | "composite";
  priorityLevel: PriorityLevel;
  autoExecutionBlocked: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type AutonomousPortfolioBoardEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ApbCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
    portfolioRiskEngine: boolean;
    businessHealthRanking: boolean;
    portfolioForecastEngine: boolean;
    acquisitionEvaluationEngine: boolean;
    portfolioOptimizationEngine: boolean;
    companyLifecycleManager: boolean;
    portfolioExpansionPlanner: boolean;
    enterpriseValueEngine: boolean;
  };
  metadataVersion: string;
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  timestamp: string;
  portfolioReference: string;
  recommendationSummary: string;
  priorityLevel: PriorityLevel;
  decisionConfidence: number;
  expectedEnterpriseImpact: string;
  autoExecutionBlocked: true;
  structuralSignalOnly: true;
};

export type ExecutiveValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveBoardRunReport = {
  executiveBoardRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "review_enterprise_performance"
    | "review_portfolio_health"
    | "review_strategic_opportunities"
    | "review_enterprise_risks"
    | "review_capital_allocation"
    | "review_expansion_opportunities"
    | "review_acquisition_opportunities"
    | "prioritize_executive_decisions"
    | "generate_executive_recommendations"
    | "diagnostics";
  engineRecord: AutonomousPortfolioBoardEngineRecord;
  boardRecords: ExecutiveBoardRecord[];
  recommendations: ExecutiveRecommendation[];
  validation: ExecutiveValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveBoardHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExecutiveValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBoardRecords: number;
  highConfidenceDecisions: number;
  averageDecisionConfidence: number;
  recommendationCount: number;
  notes: string[];
};

export type ExecutiveBoardPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  performanceReviews: number;
  healthReviews: number;
  opportunityReviews: number;
  riskReviews: number;
  capitalReviews: number;
  expansionReviews: number;
  acquisitionReviews: number;
  prioritizations: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AutonomousPortfolioBoardState = {
  engineVersion: AutonomousPortfolioBoardVersion;
  missionId: "X2-20";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousPortfolioBoardConfiguration;
  latestReport: ExecutiveBoardRunReport | null;
  engineRecord: AutonomousPortfolioBoardEngineRecord | null;
  health: ExecutiveBoardHealthReport;
  performance: ExecutiveBoardPerformanceStats;
};

export type ExecutiveBoardCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ExecutiveValidationReport["decision"] | null;
  totalBoardRecords: number;
  highConfidenceDecisions: number;
  averageDecisionConfidence: number;
  recommendationCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ExecutiveBoardLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectAutonomousPortfolioBoardInput = Record<string, unknown>;

export type ReviewEnterprisePerformanceInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewPortfolioHealthInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewStrategicOpportunitiesInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewEnterpriseRisksInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewCapitalAllocationInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewExpansionOpportunitiesInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type ReviewAcquisitionOpportunitiesInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type PrioritizeExecutiveDecisionsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type GenerateExecutiveRecommendationsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type RunExecutiveBoardDiagnosticsInput = Record<string, unknown>;
