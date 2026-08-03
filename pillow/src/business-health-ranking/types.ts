/** PILLOW-BHR-001 — Business Health Ranking types (X2-09). */

import type {
  BHR_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MANAGEMENT_PRIORITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BusinessHealthRankingConfiguration } from "./configuration.js";

export type BusinessHealthRankingVersion = "PILLOW-BHR-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type BhrCapability = (typeof BHR_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ManagementPriority = (typeof MANAGEMENT_PRIORITIES)[number];

export type RankingEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BhrCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
    portfolioRiskEngine: boolean;
    portfolioBalanceEngine: boolean;
  };
  metadataVersion: string;
};

export type BusinessHealthRecord = {
  businessHealthId: string;
  timestamp: string;
  companyReference: string;
  financialHealthScore: number;
  operationalHealthScore: number;
  customerHealthScore: number;
  growthHealthScore: number;
  operationalRiskScore: number;
  compositeHealthScore: number;
  overallEnterpriseRanking: number;
  rankingByFinancial: number;
  rankingByOperational: number;
  rankingByGrowth: number;
  rankingByCustomer: number;
  rankingByOperationalRisk: number;
  decliningDetected: boolean;
  highPerformingDetected: boolean;
  recommendedManagementPriority: ManagementPriority;
  rankingManipulated: false;
  structuralSignalOnly: true;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ManagementPriorityRecommendation = {
  recommendationId: string;
  timestamp: string;
  businessHealthId: string | null;
  companyReference: string;
  source: string;
  recommendationType: string;
  rationale: string;
  priority: ManagementPriority;
  structuralSignalOnly: true;
};

export type BusinessHealthValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessHealthRunReport = {
  rankingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "measure_health"
    | "rank_companies"
    | "detect_declining"
    | "detect_high_performing"
    | "generate_priorities"
    | "diagnostics";
  engineRecord: RankingEngineRecord;
  healthRecords: BusinessHealthRecord[];
  recommendations: ManagementPriorityRecommendation[];
  validation: BusinessHealthValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RankingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BusinessHealthValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalHealthRecords: number;
  decliningCount: number;
  highPerformingCount: number;
  notes: string[];
};

export type RankingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  healthCalculations: number;
  rankingRuns: number;
  prioritiesGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RankingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BusinessHealthRankingState = {
  engineVersion: BusinessHealthRankingVersion;
  missionId: "X2-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessHealthRankingConfiguration;
  latestReport: BusinessHealthRunReport | null;
  engineRecord: RankingEngineRecord | null;
  health: RankingHealthReport;
  performance: RankingPerformanceStats;
};

export type RankingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BusinessHealthValidationReport["decision"] | null;
  totalHealthRecords: number;
  decliningCount: number;
  highPerformingCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBusinessHealthRankingInput = {
  forceReconnect?: boolean;
};

export type MeasureBusinessHealthInput = {
  companyReference?: string;
  validated?: boolean;
};

export type RankCompaniesInput = {
  validated?: boolean;
};

export type DetectDecliningInput = {
  validated?: boolean;
};

export type DetectHighPerformingInput = {
  validated?: boolean;
};

export type GeneratePrioritiesInput = {
  validated?: boolean;
};

export type RunRankingDiagnosticsInput = {
  companyReference?: string;
};
