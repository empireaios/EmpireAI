/** PILLOW-PRE-001 — Portfolio Risk Engine types (X2-07). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PRE_CAPABILITIES,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioRiskEngineConfiguration } from "./configuration.js";

export type PortfolioRiskEngineVersion = "PILLOW-PRE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];
export type PreCapability = (typeof PRE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RiskEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PreCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
  };
  metadataVersion: string;
};

export type PortfolioRiskRecord = {
  riskRecordId: string;
  timestamp: string;
  companyReference: string | null;
  riskCategory: RiskCategory;
  riskSeverity: RiskSeverity;
  riskProbability: number;
  riskImpact: number;
  riskScore: number;
  recommendedMitigation: string;
  emerging: boolean;
  structuralSignalOnly: true;
  suppressedCritical: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RiskRecommendation = {
  recommendationId: string;
  timestamp: string;
  riskRecordId: string | null;
  source: string;
  recommendationType: string;
  rationale: string;
  priority: "low" | "medium" | "high" | "critical";
  structuralSignalOnly: true;
};

export type PortfolioRiskScoreSummary = {
  overallPortfolioRiskScore: number;
  enterpriseRiskScore: number;
  financialRiskScore: number;
  operationalRiskScore: number;
  concentrationRiskScore: number;
  criticalRiskCount: number;
  emergingRiskCount: number;
  companiesAssessed: number;
};

export type RiskValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RiskRunReport = {
  riskRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor"
    | "analyze_financial"
    | "analyze_operational"
    | "score"
    | "detect_emerging"
    | "recommend"
    | "diagnostics";
  engineRecord: RiskEngineRecord;
  riskRecords: PortfolioRiskRecord[];
  recommendations: RiskRecommendation[];
  scoreSummary: PortfolioRiskScoreSummary | null;
  validation: RiskValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RiskHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RiskValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalRiskRecords: number;
  criticalRiskCount: number;
  latestPortfolioRiskScore: number;
  notes: string[];
};

export type RiskPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  financialAnalyses: number;
  operationalAnalyses: number;
  scoringRuns: number;
  emergingDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RiskLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioRiskEngineState = {
  engineVersion: PortfolioRiskEngineVersion;
  missionId: "X2-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioRiskEngineConfiguration;
  latestReport: RiskRunReport | null;
  engineRecord: RiskEngineRecord | null;
  health: RiskHealthReport;
  performance: RiskPerformanceStats;
};

export type RiskCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: RiskValidationReport["decision"] | null;
  totalRiskRecords: number;
  criticalRiskCount: number;
  overallPortfolioRiskScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioRiskInput = {
  forceReconnect?: boolean;
};

export type MonitorRisksInput = {
  companyReference?: string;
  validated?: boolean;
};

export type AnalyzeFinancialRiskInput = {
  companyReference?: string;
  validated?: boolean;
};

export type AnalyzeOperationalRiskInput = {
  companyReference?: string;
  validated?: boolean;
};

export type ScorePortfolioRiskInput = {
  validated?: boolean;
};

export type DetectEmergingRisksInput = {
  validated?: boolean;
};

export type RecommendRiskMitigationInput = {
  validated?: boolean;
};

export type RunRiskDiagnosticsInput = {
  companyReference?: string;
};
