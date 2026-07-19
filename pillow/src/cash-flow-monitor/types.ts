/** PILLOW-CF-001 — Cash Flow Monitor types (R3-07). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  CF_CAPABILITIES,
  LIQUIDITY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";

export type CashFlowMonitorVersion = "PILLOW-CF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type LiquidityStatus = (typeof LIQUIDITY_STATUSES)[number];
export type CfCapability = (typeof CF_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CashFlowMonitorRecord = {
  monitorRecordId: string;
  timestamp: string;
  monitorId: string;
  monitorVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CfCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  bankingIntegrationConnected: boolean;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
};

export type CashFlowRecord = {
  cashFlowRecordId: string;
  timestamp: string;
  bankingReference: string | null;
  revenueReference: string | null;
  expenseReference: string | null;
  openingBalance: number;
  cashInflow: number;
  cashOutflow: number;
  closingBalance: number;
  netCashFlow: number;
  operatingCashFlow: number;
  liquidityStatus: LiquidityStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type CashFlowForecast = {
  forecastId: string;
  timestamp: string;
  horizonDays: number;
  projectedClosingBalance: number;
  projectedNetCashFlow: number;
  liquidityStatus: LiquidityStatus;
  metadataVersion: string;
};

export type CashFlowAggregationSummary = {
  summaryId: string;
  timestamp: string;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  operatingCashFlow: number;
  closingBalance: number;
  liquidityStatus: LiquidityStatus;
  totalRecords: number;
  metadataVersion: string;
};

export type CashFlowAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  cashFlowRecordId: string | null;
};

export type CashFlowValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CashFlowMonitorRunReport = {
  cashFlowRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor"
    | "monitor_inflows"
    | "monitor_outflows"
    | "monitor_liquidity"
    | "forecast"
    | "aggregate";
  monitorRecord: CashFlowMonitorRecord;
  cashFlowRecords: CashFlowRecord[];
  forecast: CashFlowForecast | null;
  aggregation: CashFlowAggregationSummary | null;
  anomalies: CashFlowAnomaly[];
  validation: CashFlowValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CashFlowHealthReport = {
  status: HealthStatus;
  healthScore: number;
  monitorEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CashFlowValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCashFlowRecords: number;
  currentLiquidityStatus: LiquidityStatus | null;
  aggregateNetCashFlow: number;
  notes: string[];
};

export type CashFlowPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  inflowMonitoringRuns: number;
  outflowMonitoringRuns: number;
  liquidityChecks: number;
  forecastsGenerated: number;
  aggregationsRun: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CashFlowLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CashFlowMonitorState = {
  engineVersion: CashFlowMonitorVersion;
  missionId: "R3-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: CashFlowMonitorConfiguration;
  latestReport: CashFlowMonitorRunReport | null;
  monitorRecord: CashFlowMonitorRecord | null;
  health: CashFlowHealthReport;
  performance: CashFlowPerformanceStats;
};

export type CashFlowCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: CashFlowValidationReport["decision"] | null;
  totalCashFlowRecords: number;
  currentLiquidityStatus: LiquidityStatus | null;
  aggregateNetCashFlow: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectCashFlowMonitorInput = {
  forceReconnect?: boolean;
};

export type MonitorCashFlowInput = {
  bankingReference?: string;
  currency?: string;
};

export type MonitorInflowsInput = {
  revenueReference?: string;
  currency?: string;
};

export type MonitorOutflowsInput = {
  expenseReference?: string;
  currency?: string;
};

export type MonitorLiquidityInput = {
  bankingReference?: string;
  currency?: string;
};

export type ForecastCashAvailabilityInput = {
  horizonDays?: number;
  bankingReference?: string;
  currency?: string;
};

export type AggregateCashFlowInput = {
  currency?: string;
};
