/** PILLOW-EPD-001 — Executive Portfolio Dashboard types (X2-06). */

import type {
  DASHBOARD_WIDGETS,
  ENGINE_STATUSES,
  EPD_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";

export type ExecutivePortfolioDashboardVersion = "PILLOW-EPD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number];
export type EpdCapability = (typeof EPD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type DashboardEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EpdCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
    capitalDistributionEngine: boolean;
  };
  metadataVersion: string;
};

export type PortfolioSummary = {
  registeredModules: number;
  activeModules: number;
  frameworkHealthScore: number;
  frameworkStatus: string;
};

export type CompanySummary = {
  totalCompanies: number;
  activeCompanies: number;
  categoriesTracked: number;
};

export type PortfolioKpiSummary = {
  companiesMeasured: number;
  averagePerformanceScore: number;
  topPerformerReference: string | null;
  portfolioSpread: number;
  overallKpiScore: number;
};

export type CapitalAllocationSummary = {
  availablePoolUnits: number;
  allocationCount: number;
  totalApprovedUnits: number;
  highRiskSignals: number;
};

export type GrowthSummary = {
  knowledgeAssets: number;
  sharedKnowledge: number;
  averageGrowthIndex: number;
};

export type EnterpriseHealthSummary = {
  overallHealthScore: number;
  companyHealthScore: number;
  performanceHealthScore: number;
  capitalHealthScore: number;
  knowledgeHealthScore: number;
  status: HealthStatus;
};

export type ExecutiveAlert = {
  alertId: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  source: string;
  message: string;
  structuralSignalOnly: true;
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  timestamp: string;
  source: string;
  recommendationType: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type DashboardWidget = {
  widgetId: string;
  widgetType: DashboardWidgetId;
  title: string;
  value: number | string;
  unit: string;
  status: "ok" | "warning" | "critical" | "empty";
  refreshedAt: string;
};

export type DrillDownView = {
  drillDownId: string;
  timestamp: string;
  focus: "company" | "kpi" | "capital" | "knowledge" | "portfolio";
  focusReference: string;
  details: string[];
  structuralSignalOnly: true;
};

export type PortfolioDashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  portfolioSummary: PortfolioSummary;
  companySummary: CompanySummary;
  portfolioKpiSummary: PortfolioKpiSummary;
  capitalAllocationSummary: CapitalAllocationSummary;
  growthSummary: GrowthSummary;
  enterpriseHealthSummary: EnterpriseHealthSummary;
  executiveAlerts: ExecutiveAlert[];
  executiveRecommendations: ExecutiveRecommendation[];
  widgets: DashboardWidget[];
  drillDown: DrillDownView | null;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  unauthorizedAccess: false;
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

export type DashboardRunReport = {
  dashboardRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "refresh"
    | "aggregate_kpis"
    | "generate_alerts"
    | "recommend"
    | "drill_down"
    | "diagnostics";
  engineRecord: DashboardEngineRecord;
  snapshot: PortfolioDashboardSnapshot | null;
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
  totalRefreshes: number;
  latestOverallScore: number;
  notes: string[];
};

export type DashboardPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  dashboardRefreshes: number;
  kpiAggregations: number;
  alertsGenerated: number;
  recommendationsGenerated: number;
  drillDowns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type DashboardLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExecutivePortfolioDashboardState = {
  engineVersion: ExecutivePortfolioDashboardVersion;
  missionId: "X2-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutivePortfolioDashboardConfiguration;
  latestReport: DashboardRunReport | null;
  engineRecord: DashboardEngineRecord | null;
  latestSnapshot: PortfolioDashboardSnapshot | null;
  health: DashboardHealthReport;
  performance: DashboardPerformanceStats;
};

export type DashboardCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: DashboardValidationReport["decision"] | null;
  companiesTracked: number;
  overallKpiScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectExecutiveDashboardInput = {
  forceReconnect?: boolean;
};

export type RefreshDashboardInput = {
  validated?: boolean;
};

export type AggregatePortfolioKpisInput = {
  validated?: boolean;
};

export type GenerateExecutiveAlertsInput = {
  validated?: boolean;
};

export type RecommendExecutiveInput = {
  validated?: boolean;
};

export type DrillDownInput = {
  focus: DrillDownView["focus"];
  focusReference: string;
  validated?: boolean;
};

export type RunDashboardDiagnosticsInput = {
  focusReference?: string;
};
