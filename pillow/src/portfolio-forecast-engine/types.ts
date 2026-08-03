/** PILLOW-PFE-001 — Portfolio Forecast Engine types (X2-14). */

import type {
  ENGINE_STATUSES,
  FORECAST_PERIODS,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PFE_CAPABILITIES,
  SCENARIO_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioForecastEngineConfiguration } from "./configuration.js";

export type PortfolioForecastEngineVersion = "PILLOW-PFE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PfeCapability = (typeof PFE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ForecastPeriod = (typeof FORECAST_PERIODS)[number];
export type ScenarioType = (typeof SCENARIO_TYPES)[number];

export type PortfolioForecastEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PfeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    capitalDistributionEngine: boolean;
    executivePortfolioDashboard: boolean;
    portfolioRiskEngine: boolean;
    portfolioBalanceEngine: boolean;
    businessHealthRanking: boolean;
    sharedCustomerIntelligence: boolean;
    sharedSupplierIntelligence: boolean;
  };
  metadataVersion: string;
};

export type ForecastRecord = {
  forecastId: string;
  timestamp: string;
  portfolioReference: string;
  forecastPeriod: ForecastPeriod;
  revenueForecast: number;
  profitForecast: number;
  growthForecast: number;
  riskForecast: number;
  confidenceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  customerGrowthForecast: number;
  supplierCapacityForecast: number;
  capitalRequirementForecast: number;
  notGuaranteedOutcome: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type ForecastScenario = {
  scenarioId: string;
  timestamp: string;
  scenarioType: ScenarioType;
  portfolioReference: string;
  forecastPeriod: ForecastPeriod;
  revenueForecast: number;
  profitForecast: number;
  growthForecast: number;
  riskForecast: number;
  confidenceScore: number;
  rationale: string;
  notGuaranteedOutcome: true;
  structuralSignalOnly: true;
};

export type ForecastValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ForecastRunReport = {
  forecastRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "forecast_revenue"
    | "forecast_profit"
    | "forecast_growth"
    | "forecast_capital"
    | "forecast_customer_growth"
    | "forecast_supplier_capacity"
    | "forecast_risks"
    | "generate_scenarios"
    | "generate_executive_forecast"
    | "diagnostics";
  engineRecord: PortfolioForecastEngineRecord;
  forecastRecords: ForecastRecord[];
  scenarios: ForecastScenario[];
  validation: ForecastValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ForecastHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ForecastValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalForecastRecords: number;
  totalScenarios: number;
  averageConfidence: number;
  notes: string[];
};

export type ForecastPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  revenueForecasts: number;
  profitForecasts: number;
  growthForecasts: number;
  capitalForecasts: number;
  customerGrowthForecasts: number;
  supplierCapacityForecasts: number;
  riskForecasts: number;
  scenariosGenerated: number;
  executiveForecasts: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ForecastLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PortfolioForecastEngineState = {
  engineVersion: PortfolioForecastEngineVersion;
  missionId: "X2-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioForecastEngineConfiguration;
  latestReport: ForecastRunReport | null;
  engineRecord: PortfolioForecastEngineRecord | null;
  health: ForecastHealthReport;
  performance: ForecastPerformanceStats;
};

export type ForecastCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ForecastValidationReport["decision"] | null;
  totalForecastRecords: number;
  totalScenarios: number;
  averageConfidence: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioForecastEngineInput = {
  forceReconnect?: boolean;
};

export type ForecastRequestInput = {
  portfolioReference?: string;
  forecastPeriod?: ForecastPeriod;
  baselineRevenue?: number;
  baselineProfit?: number;
  companyCount?: number;
  validated?: boolean;
};

export type GenerateScenariosInput = {
  portfolioReference?: string;
  forecastPeriod?: ForecastPeriod;
  validated?: boolean;
};

export type GenerateExecutiveForecastInput = {
  portfolioReference?: string;
  forecastPeriod?: ForecastPeriod;
  validated?: boolean;
};

export type RunForecastDiagnosticsInput = {
  portfolioReference?: string;
};
