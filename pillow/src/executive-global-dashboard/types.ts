/** PILLOW-EGD-001 — Executive Global Dashboard types (X4-10). */

import type {
  ALERT_SEVERITIES,
  DASHBOARD_WIDGETS,
  ENGINE_STATUSES,
  EGD_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";

export type ExecutiveGlobalDashboardVersion = "PILLOW-EGD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type EgdCapability = (typeof EGD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export type ExecutiveAlert = {
  alertId: string;
  severity: AlertSeverity;
  widget: DashboardWidget;
  summary: string;
  timestamp: string;
};

export type DashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  companyReference: string;
  globalOperationsSummary: string;
  countryExpansionSummary: string;
  regionalPerformanceSummary: string;
  marketOpportunitySummary: string;
  logisticsSummary: string;
  complianceSummary: string;
  taxationSummary: string;
  localizationReadinessSummary: string;
  executiveAlerts: ExecutiveAlert[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
  activeWidgets: DashboardWidget[];
  recommendationSummary: string;
  dashboardTraceId: string;
  structuralSignalOnly: true;
  neverExposeRestrictedEnterpriseInformation: true;
  restrictedInformationExposureClaim: "none";
  authorizedAccess: true;
};

export type ExecutiveGlobalDashboardEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EgdCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
    regionalComplianceEngine: boolean;
    globalTaxIntelligence: boolean;
    internationalLogisticsEngine: boolean;
    globalMarketIntelligence: boolean;
  };
  metadataVersion: string;
};

export type DashboardRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  widget: DashboardWidget;
  severity: AlertSeverity;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverExposeRestrictedEnterpriseInformation: true;
  restrictedInformationExposureClaim: "none";
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

export type EgdRunReport = {
  dashboardRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "display_worldwide_operations"
    | "display_country_expansion"
    | "display_regional_performance"
    | "display_market_opportunities"
    | "display_logistics_performance"
    | "display_compliance_status"
    | "display_taxation_status"
    | "display_localization_readiness"
    | "display_executive_alerts"
    | "display_global_recommendations"
    | "refresh_dashboard"
    | "diagnostics";
  engineRecord: ExecutiveGlobalDashboardEngineRecord;
  snapshots: DashboardSnapshot[];
  recommendations: DashboardRecommendation[];
  validation: DashboardValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EgdHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: DashboardValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSnapshots: number;
  alertCount: number;
  widgetCount: number;
  notes: string[];
};

export type EgdPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  worldwideOpsDisplays: number;
  countryExpansionDisplays: number;
  regionalPerformanceDisplays: number;
  marketOpportunityDisplays: number;
  logisticsDisplays: number;
  complianceDisplays: number;
  taxationDisplays: number;
  localizationDisplays: number;
  alertDisplays: number;
  recommendationDisplays: number;
  refreshOps: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExecutiveGlobalDashboardState = {
  engineVersion: ExecutiveGlobalDashboardVersion;
  missionId: "X4-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveGlobalDashboardConfiguration;
  latestReport: EgdRunReport | null;
  engineRecord: ExecutiveGlobalDashboardEngineRecord | null;
  health: EgdHealthReport;
  performance: EgdPerformanceStats;
};

export type EgdCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: DashboardValidationReport["decision"] | null;
  totalSnapshots: number;
  alertCount: number;
  widgetCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type EgdLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectExecutiveGlobalDashboardInput = Record<string, unknown>;

export type DashboardAnalysisInput = {
  companyReference?: string;
  authorized?: boolean;
  widgetFocus?: DashboardWidget;
  alertHint?: boolean;
  validated?: boolean;
};

export type RunEgdDiagnosticsInput = {
  companyReference?: string;
};
