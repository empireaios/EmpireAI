/** PILLOW-EFD-001 — Executive Financial Dashboard types (R3-16). */

import type {
  EFD_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
  WIDGET_TYPES,
} from "./paths.js";
import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";

export type ExecutiveFinancialDashboardVersion = "PILLOW-EFD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type WidgetType = (typeof WIDGET_TYPES)[number];
export type EfdCapability = (typeof EFD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ExecutiveFinancialDashboardRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EfdCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  cashFlowMonitorConnected: boolean;
  financialForecastEngineConnected: boolean;
  budgetManagementEngineConnected: boolean;
  financialRiskMonitorConnected: boolean;
};

export type DashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  revenueSummary: { total: number; count: number; currency: string };
  expenseSummary: { total: number; count: number; currency: string };
  profitSummary: { netProfit: number; marginPercent: number; currency: string };
  cashFlowSummary: { netCashFlow: number; liquidity: number; currency: string };
  budgetSummary: { totalAllocation: number; utilizationPercent: number; count: number };
  forecastSummary: { revenueForecast: number; expenseForecast: number; confidence: number };
  financialRiskSummary: { riskScore: number; activeAlerts: number; status: string };
  kpiSummary: { kpis: ExecutiveKpi[] };
  trendSummary: { trends: DashboardTrend[] };
  metadataVersion: string;
};

export type ExecutiveKpi = {
  kpiId: string;
  label: string;
  value: number;
  unit: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
};

export type DashboardTrend = {
  trendId: string;
  metric: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
  description: string;
};

export type DashboardWidget = {
  widgetId: string;
  widgetType: WidgetType;
  label: string;
  value: number | string;
  status: "ready" | "degraded" | "unavailable";
  lastUpdated: string;
};

export type DashboardValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveDashboardRunReport = {
  dashboardRunReportId: string;
  runTimestamp: string;
  action: "connect" | "refresh_dashboard" | "generate_summary" | "aggregate_kpis" | "get_widgets";
  engineRecord: ExecutiveFinancialDashboardRecord;
  snapshots: DashboardSnapshot[];
  widgets: DashboardWidget[];
  validation: DashboardValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DashboardHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: DashboardValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSnapshots: number;
  lastRefreshAt: string | null;
  notes: string[];
};

export type DashboardPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  refreshesPerformed: number;
  summariesGenerated: number;
  kpisAggregated: number;
  widgetsServed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type EfdLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExecutiveFinancialDashboardState = {
  engineVersion: ExecutiveFinancialDashboardVersion;
  missionId: "R3-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveFinancialDashboardConfiguration;
  latestReport: ExecutiveDashboardRunReport | null;
  engineRecord: ExecutiveFinancialDashboardRecord | null;
  health: DashboardHealthReport;
  performance: DashboardPerformanceStats;
};

export type DashboardCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: DashboardValidationReport["decision"] | null;
  totalSnapshots: number;
  lastRefreshAt: string | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectExecutiveFinancialDashboardInput = { forceReconnect?: boolean };
export type RefreshExecutiveDashboardInput = { forceRefresh?: boolean };
export type GenerateExecutiveSummaryInput = Record<string, never>;
export type AggregateFinancialKpisInput = Record<string, never>;
export type GetDashboardWidgetsInput = { widgetTypes?: WidgetType[] };
