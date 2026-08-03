/** PILLOW-EVE-001 — Enterprise Value Engine types (X2-19). */

import type {
  ANOMALY_SEVERITIES,
  EVE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  VALUATION_METHODOLOGIES,
} from "./paths.js";
import type { EnterpriseValueEngineConfiguration } from "./configuration.js";

export type EnterpriseValueEngineVersion = "PILLOW-EVE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type EveCapability = (typeof EVE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValuationMethodology = (typeof VALUATION_METHODOLOGIES)[number];
export type AnomalySeverity = (typeof ANOMALY_SEVERITIES)[number];

export type ValuationRecord = {
  enterpriseValueId: string;
  timestamp: string;
  portfolioReference: string;
  companyReference: string | null;
  enterpriseValuation: number;
  portfolioValuation: number;
  companyValuation: number;
  valuationMethodology: ValuationMethodology;
  confidenceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  notGuaranteedMarketPrice: true;
  structuralSignalOnly: true;
  sensitiveFinancialData: false;
  anomalyDetected: boolean;
  valueGrowthRate: number;
};

export type EnterpriseValueEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EveCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
    businessHealthRanking: boolean;
    portfolioForecastEngine: boolean;
    acquisitionEvaluationEngine: boolean;
    portfolioOptimizationEngine: boolean;
    portfolioExpansionPlanner: boolean;
  };
  metadataVersion: string;
};

export type ValuationHistoryEntry = {
  historyId: string;
  timestamp: string;
  portfolioReference: string;
  companyReference: string | null;
  enterpriseValuation: number;
  portfolioValuation: number;
  companyValuation: number;
  valueGrowthRate: number;
  valuationMethodology: ValuationMethodology;
  metadataVersion: string;
};

export type ValuationAnomaly = {
  anomalyId: string;
  timestamp: string;
  portfolioReference: string;
  companyReference: string | null;
  severity: AnomalySeverity;
  deviationPercent: number;
  description: string;
  notGuaranteedMarketPrice: true;
  structuralSignalOnly: true;
};

export type ValuationRecommendation = {
  recommendationId: string;
  timestamp: string;
  portfolioReference: string;
  companyReference: string | null;
  recommendationSummary: string;
  estimatedValue: number;
  confidenceScore: number;
  valuationMethodology: ValuationMethodology;
  notGuaranteedMarketPrice: true;
  structuralSignalOnly: true;
};

export type ValuationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ValuationRunReport = {
  valuationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "calculate_enterprise_value"
    | "calculate_company_valuation"
    | "calculate_portfolio_valuation"
    | "estimate_intrinsic"
    | "estimate_market"
    | "measure_value_growth"
    | "track_history"
    | "detect_anomalies"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: EnterpriseValueEngineRecord;
  valuationRecords: ValuationRecord[];
  historyEntries: ValuationHistoryEntry[];
  anomalies: ValuationAnomaly[];
  recommendations: ValuationRecommendation[];
  validation: ValuationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ValuationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ValuationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalValuationRecords: number;
  highConfidenceValuations: number;
  averageConfidenceScore: number;
  anomalyCount: number;
  notes: string[];
};

export type ValuationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  enterpriseValueOps: number;
  companyValuationOps: number;
  portfolioValuationOps: number;
  intrinsicEstimateOps: number;
  marketEstimateOps: number;
  valueGrowthOps: number;
  historyTrackingOps: number;
  anomalyDetectionOps: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ValuationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type EnterpriseValueEngineState = {
  engineVersion: EnterpriseValueEngineVersion;
  missionId: "X2-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: EnterpriseValueEngineConfiguration;
  latestReport: ValuationRunReport | null;
  engineRecord: EnterpriseValueEngineRecord | null;
  health: ValuationHealthReport;
  performance: ValuationPerformanceStats;
};

export type ValuationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ValuationValidationReport["decision"] | null;
  totalValuationRecords: number;
  highConfidenceValuations: number;
  averageConfidenceScore: number;
  anomalyCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectEnterpriseValueEngineInput = {
  forceReconnect?: boolean;
};

export type CalculateEnterpriseValueInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type CalculateCompanyValuationInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type CalculatePortfolioValuationInput = {
  portfolioReference?: string;
  validated?: boolean;
};

export type EstimateIntrinsicValueInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type EstimateMarketValueInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type MeasureValueGrowthInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type TrackValuationHistoryInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type DetectValuationAnomaliesInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type GenerateValuationRecommendationsInput = {
  portfolioReference?: string;
  companyReference?: string;
  validated?: boolean;
};

export type RunValuationDiagnosticsInput = {
  portfolioReference?: string;
};
