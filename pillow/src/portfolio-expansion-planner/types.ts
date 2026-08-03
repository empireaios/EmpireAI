/** PILLOW-PEP-001 — Portfolio Expansion Planner types (X2-18). */

import type {
  ENGINE_STATUSES,
  EXPANSION_CATEGORIES,
  EXPANSION_PRIORITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PEP_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";

export type PortfolioExpansionPlannerVersion = "PILLOW-PEP-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PepCapability = (typeof PEP_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ExpansionCategory = (typeof EXPANSION_CATEGORIES)[number];
export type ExpansionPriority = (typeof EXPANSION_PRIORITIES)[number];

export type PortfolioExpansionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PepCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    portfolioRiskEngine: boolean;
    businessHealthRanking: boolean;
    acquisitionEvaluationEngine: boolean;
    portfolioOptimizationEngine: boolean;
    companyLifecycleManager: boolean;
  };
  metadataVersion: string;
};

export type ExpansionRecord = {
  expansionPlanId: string;
  timestamp: string;
  portfolioReference: string;
  expansionOpportunity: string;
  expansionCategory: ExpansionCategory;
  estimatedInvestment: number;
  expectedReturn: number;
  expansionPriority: ExpansionPriority;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  rankedPosition: number | null;
  requiresApproval: boolean;
  autoInitiationBlocked: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type ExpansionRecommendation = {
  recommendationId: string;
  timestamp: string;
  portfolioReference: string;
  expansionCategory: ExpansionCategory;
  recommendationSummary: string;
  estimatedInvestment: number;
  expectedReturn: number;
  priority: ExpansionPriority;
  requiresApproval: boolean;
  autoInitiationBlocked: true;
  structuralSignalOnly: true;
};

export type ExpansionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExpansionRunReport = {
  expansionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "identify_opportunities"
    | "evaluate_markets"
    | "evaluate_industries"
    | "evaluate_internal"
    | "evaluate_acquisition"
    | "prioritize"
    | "estimate_costs"
    | "estimate_returns"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: PortfolioExpansionEngineRecord;
  expansionRecords: ExpansionRecord[];
  recommendations: ExpansionRecommendation[];
  validation: ExpansionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExpansionHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExpansionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalExpansionRecords: number;
  highPriorityExpansions: number;
  averageExpectedReturn: number;
  notes: string[];
};

export type ExpansionPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  identifyOpportunitiesOps: number;
  evaluateMarketsOps: number;
  evaluateIndustriesOps: number;
  evaluateInternalOps: number;
  evaluateAcquisitionOps: number;
  prioritizeOps: number;
  estimateCostsOps: number;
  estimateReturnsOps: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExpansionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioExpansionPlannerState = {
  engineVersion: PortfolioExpansionPlannerVersion;
  missionId: "X2-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioExpansionPlannerConfiguration;
  latestReport: ExpansionRunReport | null;
  engineRecord: PortfolioExpansionEngineRecord | null;
  health: ExpansionHealthReport;
  performance: ExpansionPerformanceStats;
};

export type ExpansionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ExpansionValidationReport["decision"] | null;
  totalExpansionRecords: number;
  highPriorityExpansions: number;
  averageExpectedReturn: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioExpansionPlannerInput = {
  forceReconnect?: boolean;
};

export type IdentifyExpansionOpportunitiesInput = {
  portfolioReference?: string;
  categories?: ExpansionCategory[];
  validated?: boolean;
};

export type EvaluateExpansionInput = {
  portfolioReference?: string;
  opportunityHint?: string;
  investmentHint?: number;
  returnHint?: number;
  validated?: boolean;
};

export type PrioritizeExpansionsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type EstimateExpansionCostsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type EstimateExpansionReturnsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type GenerateExpansionRecommendationsInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type RunExpansionDiagnosticsInput = {
  portfolioReference?: string;
};
