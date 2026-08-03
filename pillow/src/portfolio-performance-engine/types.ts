/** PILLOW-PPE-001 — Portfolio Performance Engine types (X2-03). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PPE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioPerformanceEngineConfiguration } from "./configuration.js";

export type PortfolioPerformanceEngineVersion = "PILLOW-PPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PpeCapability = (typeof PPE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type MetricBundle = {
  revenueIndex: number;
  profitabilityIndex: number;
  operationalEfficiencyIndex: number;
  customerPerformanceIndex: number;
  growthIndex: number;
};

export type PerformanceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PpeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
  };
  metadataVersion: string;
};

export type PortfolioPerformanceRecord = {
  portfolioPerformanceId: string;
  timestamp: string;
  companyReference: string;
  revenueMetrics: { revenueIndex: number };
  profitabilityMetrics: { profitabilityIndex: number };
  operationalMetrics: { operationalEfficiencyIndex: number };
  growthMetrics: { growthIndex: number; customerPerformanceIndex: number };
  overallPerformanceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  manipulatedMetrics: false;
  ranking: number | null;
};

export type PortfolioKpiSnapshot = {
  kpiId: string;
  timestamp: string;
  averagePerformanceScore: number;
  medianPerformanceScore: number;
  topPerformerReference: string | null;
  bottomPerformerReference: string | null;
  companiesMeasured: number;
  portfolioSpread: number;
  structuralSignalOnly: true;
};

export type PerformanceRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string | null;
  recommendationType:
    | "improve_revenue"
    | "improve_profitability"
    | "improve_efficiency"
    | "improve_customer"
    | "improve_growth"
    | "rebalance_focus"
    | "maintain";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type PerformanceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PerformanceRunReport = {
  performanceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "measure_company"
    | "compare_companies"
    | "calculate_kpis"
    | "analyze_portfolio"
    | "recommend"
    | "diagnostics";
  engineRecord: PerformanceEngineRecord;
  performanceRecords: PortfolioPerformanceRecord[];
  kpiSnapshot: PortfolioKpiSnapshot | null;
  recommendations: PerformanceRecommendation[];
  validation: PerformanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PerformanceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: PerformanceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPerformanceRecords: number;
  averagePerformanceScore: number;
  notes: string[];
};

export type PerformancePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  companiesMeasured: number;
  comparisonsRun: number;
  kpiCalculations: number;
  analyticsRuns: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type PerformanceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioPerformanceEngineState = {
  engineVersion: PortfolioPerformanceEngineVersion;
  missionId: "X2-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioPerformanceEngineConfiguration;
  latestReport: PerformanceRunReport | null;
  engineRecord: PerformanceEngineRecord | null;
  health: PerformanceHealthReport;
  performance: PerformancePerformanceStats;
};

export type PerformanceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: PerformanceValidationReport["decision"] | null;
  totalPerformanceRecords: number;
  averagePerformanceScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioPerformanceInput = {
  forceReconnect?: boolean;
};

export type MeasureCompanyPerformanceInput = {
  companyReference: string;
  metrics?: Partial<MetricBundle>;
  validated?: boolean;
};

export type CompareCompaniesInput = {
  companyReferences?: string[];
  validated?: boolean;
};

export type CalculatePortfolioKpisInput = {
  validated?: boolean;
};

export type AnalyzePortfolioInput = {
  validated?: boolean;
};

export type RecommendPerformanceInput = {
  companyReference?: string;
};

export type RunPerformanceDiagnosticsInput = {
  companyReference?: string;
};
