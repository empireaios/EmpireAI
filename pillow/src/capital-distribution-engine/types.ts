/** PILLOW-CDE-001 — Capital Distribution Engine types (X2-05). */

import type {
  ALLOCATION_PRIORITIES,
  CDE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";

export type CapitalDistributionEngineVersion = "PILLOW-CDE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AllocationPriority = (typeof ALLOCATION_PRIORITIES)[number];
export type CdeCapability = (typeof CDE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CapitalEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CdeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
  };
  metadataVersion: string;
};

export type CapitalPoolRecord = {
  capitalPoolId: string;
  timestamp: string;
  poolReference: string;
  availableUnits: number;
  reservedUnits: number;
  allocatedUnits: number;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type CapitalAllocationRecord = {
  capitalAllocationId: string;
  timestamp: string;
  companyReference: string;
  investmentOpportunityReference: string;
  requestedCapital: number;
  approvedAllocation: number;
  expectedRoi: number;
  allocationPriority: AllocationPriority;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  capitalEfficiency: number;
  autoApproved: boolean;
  requiresManualApproval: boolean;
  structuralSignalOnly: true;
  sensitiveFinancialData: false;
  ranking: number | null;
};

export type CapitalRiskSignal = {
  riskId: string;
  timestamp: string;
  riskType: "shortage" | "concentration" | "over_request" | "low_roi";
  companyReference: string | null;
  severity: "low" | "medium" | "high";
  rationale: string;
  structuralSignalOnly: true;
};

export type CapitalRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string | null;
  capitalAllocationId: string | null;
  recommendationType:
    | "allocate"
    | "defer"
    | "reduce"
    | "increase_pool"
    | "diversify"
    | "manual_review"
    | "reject";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type CapitalValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CapitalRunReport = {
  capitalRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_pool"
    | "evaluate_funding"
    | "evaluate_opportunity"
    | "allocate"
    | "analyze_risk"
    | "rank_priorities"
    | "recommend"
    | "diagnostics";
  engineRecord: CapitalEngineRecord;
  poolRecords: CapitalPoolRecord[];
  allocationRecords: CapitalAllocationRecord[];
  riskSignals: CapitalRiskSignal[];
  recommendations: CapitalRecommendation[];
  validation: CapitalValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CapitalHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CapitalValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAllocationRecords: number;
  availablePoolUnits: number;
  highRiskSignals: number;
  notes: string[];
};

export type CapitalPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  fundingEvaluations: number;
  opportunityEvaluations: number;
  allocationsProposed: number;
  riskAnalyses: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CapitalLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CapitalDistributionEngineState = {
  engineVersion: CapitalDistributionEngineVersion;
  missionId: "X2-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: CapitalDistributionEngineConfiguration;
  latestReport: CapitalRunReport | null;
  engineRecord: CapitalEngineRecord | null;
  health: CapitalHealthReport;
  performance: CapitalPerformanceStats;
};

export type CapitalCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CapitalValidationReport["decision"] | null;
  totalAllocationRecords: number;
  availablePoolUnits: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCapitalDistributionInput = {
  forceReconnect?: boolean;
};

export type ManageCapitalPoolInput = {
  poolReference?: string;
  availableUnits?: number;
  validated?: boolean;
};

export type EvaluateFundingInput = {
  companyReference: string;
  requestedCapital: number;
  investmentOpportunityReference?: string;
  expectedRoiHint?: number;
  validated?: boolean;
};

export type EvaluateOpportunityInput = {
  companyReference: string;
  investmentOpportunityReference: string;
  requestedCapital: number;
  expectedRoiHint?: number;
  validated?: boolean;
};

export type AllocateCapitalInput = {
  companyReference: string;
  investmentOpportunityReference: string;
  requestedCapital: number;
  expectedRoiHint?: number;
  validated?: boolean;
};

export type AnalyzeCapitalRiskInput = {
  validated?: boolean;
};

export type RankCapitalPrioritiesInput = {
  validated?: boolean;
};

export type RecommendCapitalInput = {
  companyReference?: string;
};

export type RunCapitalDiagnosticsInput = {
  companyReference?: string;
};
