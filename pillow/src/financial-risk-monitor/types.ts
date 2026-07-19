/** PILLOW-FRM-001 — Financial Risk Monitor types (R3-15). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  FRM_CAPABILITIES,
  HEALTH_STATUSES,
  RISK_CATEGORIES,
  RISK_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FinancialRiskMonitorConfiguration } from "./configuration.js";

export type FinancialRiskMonitorVersion = "PILLOW-FRM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export type RiskStatus = (typeof RISK_STATUSES)[number];
export type FrmCapability = (typeof FRM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type FinancialRiskMonitorRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FrmCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  cashFlowMonitorConnected: boolean;
  financialForecastEngineConnected: boolean;
  budgetManagementEngineConnected: boolean;
};

export type FinancialRiskRecord = {
  financialRiskId: string;
  timestamp: string;
  riskCategory: string;
  riskScore: number;
  liquidityStatus: RiskStatus;
  profitabilityStatus: RiskStatus;
  budgetStatus: RiskStatus;
  revenueRisk: number;
  expenseRisk: number;
  activeAlerts: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type FinancialRiskAlert = {
  alertId: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  description: string;
  financialRiskId: string | null;
  thresholdBreached: boolean;
};

export type FinancialAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  metric: string;
  description: string;
  financialRiskId: string | null;
  deviationPercent: number;
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

export type FinancialRiskRunReport = {
  riskRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_health"
    | "calculate_risk_score"
    | "detect_anomalies"
    | "detect_threshold_breaches"
    | "generate_alerts";
  engineRecord: FinancialRiskMonitorRecord;
  riskRecords: FinancialRiskRecord[];
  alerts: FinancialRiskAlert[];
  anomalies: FinancialAnomaly[];
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
  lastRiskScore: number | null;
  notes: string[];
};

export type RiskPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  healthChecksPerformed: number;
  riskScoresCalculated: number;
  anomaliesDetected: number;
  thresholdBreachesDetected: number;
  alertsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type FrmLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FinancialRiskMonitorState = {
  engineVersion: FinancialRiskMonitorVersion;
  missionId: "R3-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialRiskMonitorConfiguration;
  latestReport: FinancialRiskRunReport | null;
  engineRecord: FinancialRiskMonitorRecord | null;
  health: RiskHealthReport;
  performance: RiskPerformanceStats;
};

export type RiskCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: RiskValidationReport["decision"] | null;
  totalRiskRecords: number;
  lastRiskScore: number | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectFinancialRiskMonitorInput = {
  forceReconnect?: boolean;
};

export type MonitorFinancialHealthInput = {
  riskCategory?: RiskCategory;
};

export type CalculateFinancialRiskScoreInput = {
  riskCategory?: RiskCategory;
};

export type DetectFinancialAnomaliesInput = {
  riskRecordId?: string;
};

export type DetectThresholdBreachesInput = {
  riskRecordId?: string;
};

export type GenerateFinancialRiskAlertsInput = {
  riskRecordId?: string;
};
