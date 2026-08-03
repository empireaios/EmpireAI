/** PILLOW-PBE-001 — Portfolio Balance Engine types (X2-08). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PBE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioBalanceEngineConfiguration } from "./configuration.js";

export type PortfolioBalanceEngineVersion = "PILLOW-PBE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PbeCapability = (typeof PBE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BalanceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PbeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
    portfolioRiskEngine: boolean;
  };
  metadataVersion: string;
};

export type BalancingAction = {
  actionId: string;
  actionType: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  requiresManualApproval: true;
  autoApplied: false;
  structuralSignalOnly: true;
};

export type PortfolioBalanceRecord = {
  portfolioBalanceId: string;
  timestamp: string;
  portfolioReference: string;
  diversificationScore: number;
  industryConcentrationScore: number;
  revenueConcentrationScore: number;
  capitalConcentrationScore: number;
  geographicExposureScore: number;
  imbalanceDetected: boolean;
  overexposureDetected: boolean;
  recommendedBalancingActions: BalancingAction[];
  autoRebalanceApplied: false;
  structuralSignalOnly: true;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BalanceRecommendation = {
  recommendationId: string;
  timestamp: string;
  portfolioBalanceId: string | null;
  source: string;
  recommendationType: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  requiresManualApproval: true;
  autoApplied: false;
  structuralSignalOnly: true;
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

export type BalanceRunReport = {
  balanceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "measure_diversification"
    | "analyze_concentration"
    | "analyze_exposure"
    | "detect_imbalance"
    | "optimize"
    | "recommend"
    | "diagnostics";
  engineRecord: BalanceEngineRecord;
  balanceRecords: PortfolioBalanceRecord[];
  recommendations: BalanceRecommendation[];
  validation: BalanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BalanceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BalanceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBalanceRecords: number;
  latestDiversificationScore: number;
  imbalanceCount: number;
  notes: string[];
};

export type BalancePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  diversificationAnalyses: number;
  concentrationAnalyses: number;
  exposureAnalyses: number;
  optimizationRuns: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BalanceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioBalanceEngineState = {
  engineVersion: PortfolioBalanceEngineVersion;
  missionId: "X2-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioBalanceEngineConfiguration;
  latestReport: BalanceRunReport | null;
  engineRecord: BalanceEngineRecord | null;
  health: BalanceHealthReport;
  performance: BalancePerformanceStats;
};

export type BalanceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BalanceValidationReport["decision"] | null;
  totalBalanceRecords: number;
  latestDiversificationScore: number;
  imbalanceDetected: boolean;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioBalanceInput = {
  forceReconnect?: boolean;
};

export type MeasureDiversificationInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type AnalyzeConcentrationInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type AnalyzeExposureInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type DetectImbalanceInput = {
  validated?: boolean;
};

export type OptimizePortfolioBalanceInput = {
  validated?: boolean;
};

export type RecommendBalanceInput = {
  validated?: boolean;
};

export type RunBalanceDiagnosticsInput = {
  portfolioReference?: string;
};
