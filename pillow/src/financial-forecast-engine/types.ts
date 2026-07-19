/** PILLOW-FCT-001 — Financial Forecast Engine types (R3-13). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  FCT_CAPABILITIES,
  FORECAST_PERIODS,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";

export type FinancialForecastEngineVersion = "PILLOW-FCT-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ForecastPeriod = (typeof FORECAST_PERIODS)[number];
export type FctCapability = (typeof FCT_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type FinancialForecastEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FctCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  cashFlowMonitorConnected: boolean;
  multiCurrencyEngineConnected: boolean;
};

export type ForecastRecord = {
  forecastRecordId: string;
  timestamp: string;
  forecastPeriod: string;
  revenueForecast: number;
  expenseForecast: number;
  profitForecast: number;
  cashFlowForecast: number;
  liquidityForecast: number;
  forecastConfidenceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type FinancialTrend = {
  trendId: string;
  timestamp: string;
  metric: "revenue" | "expense" | "profit" | "cash_flow" | "liquidity";
  direction: "up" | "down" | "stable";
  changePercent: number;
  description: string;
  metadataVersion: string;
};

export type ForecastDeviation = {
  deviationId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  forecastRecordId: string | null;
};

export type FinancialRisk = {
  riskId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  forecastRecordId: string | null;
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

export type FinancialForecastRunReport = {
  forecastRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "generate_projection"
    | "analyze_trends"
    | "detect_deviations";
  engineRecord: FinancialForecastEngineRecord;
  forecastRecords: ForecastRecord[];
  trends: FinancialTrend[];
  deviations: ForecastDeviation[];
  risks: FinancialRisk[];
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
  lastConfidenceScore: number | null;
  notes: string[];
};

export type ForecastPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  projectionsGenerated: number;
  trendsAnalyzed: number;
  deviationsDetected: number;
  risksDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type FctLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FinancialForecastEngineState = {
  engineVersion: FinancialForecastEngineVersion;
  missionId: "R3-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialForecastEngineConfiguration;
  latestReport: FinancialForecastRunReport | null;
  engineRecord: FinancialForecastEngineRecord | null;
  health: ForecastHealthReport;
  performance: ForecastPerformanceStats;
};

export type ForecastCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ForecastValidationReport["decision"] | null;
  totalForecastRecords: number;
  lastConfidenceScore: number | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectFinancialForecastEngineInput = {
  forceReconnect?: boolean;
};

export type GenerateFinancialProjectionInput = {
  forecastPeriod?: ForecastPeriod;
};

export type AnalyzeFinancialTrendsInput = {
  forecastPeriod?: ForecastPeriod;
};

export type DetectForecastDeviationsInput = {
  forecastRecordId?: string;
};
