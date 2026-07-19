/** PILLOW-ECD-001 — Executive Customer Dashboard types (R4-18). */

import type {
  ECD_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
  WIDGET_TYPES,
} from "./paths.js";
import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";

export type ExecutiveCustomerDashboardVersion = "PILLOW-ECD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type WidgetType = (typeof WIDGET_TYPES)[number];
export type EcdCapability = (typeof ECD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ExecutiveCustomerDashboardRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EcdCapability[];
  metadataVersion: string;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  sentimentEngineConnected: boolean;
  reviewManagementEngineConnected: boolean;
  loyaltyProgrammeEngineConnected: boolean;
  customerRiskEngineConnected: boolean;
  customerLifetimeValueEngineConnected: boolean;
  customerSegmentationEngineConnected: boolean;
  customerJourneyIntelligenceEngineConnected: boolean;
};

export type CustomerGrowthSummary = {
  totalCustomers: number;
  newCustomers: number;
  growthRatePercent: number;
  trend: "up" | "down" | "stable";
};

export type CustomerActivitySummary = {
  totalEvents: number;
  purchaseEvents: number;
  supportEvents: number;
  communicationEvents: number;
  activeCustomers: number;
};

export type CustomerLifetimeValueSummary = {
  averageClv: number;
  totalClv: number;
  highValueCustomers: number;
  decliningValueCustomers: number;
};

export type CustomerSegmentationSummary = {
  totalSegments: number;
  assignedCustomers: number;
  topSegments: string[];
};

export type CustomerSentimentSummary = {
  averageScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
};

export type LoyaltySummary = {
  totalMembers: number;
  averagePoints: number;
  tierDistribution: Record<string, number>;
};

export type JourneySummary = {
  journeysMapped: number;
  averageJourneyScore: number;
  dropOffDetected: number;
  frictionDetected: number;
};

export type CustomerRiskSummary = {
  averageRiskScore: number;
  highRiskCustomers: number;
  mediumRiskCustomers: number;
  lowRiskCustomers: number;
};

export type CustomerSupportSummary = {
  totalSupportRecords: number;
  resolvedCount: number;
  openCount: number;
  resolutionRatePercent: number;
  averageResponseTimeMs: number;
};

export type ExecutiveCustomerKpi = {
  kpiId: string;
  label: string;
  value: number;
  unit: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
};

export type CustomerDashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  customerGrowthSummary: CustomerGrowthSummary;
  customerActivitySummary: CustomerActivitySummary;
  customerLifetimeValueSummary: CustomerLifetimeValueSummary;
  customerSegmentationSummary: CustomerSegmentationSummary;
  customerSentimentSummary: CustomerSentimentSummary;
  loyaltySummary: LoyaltySummary;
  journeySummary: JourneySummary;
  customerRiskSummary: CustomerRiskSummary;
  supportSummary: CustomerSupportSummary;
  kpiSummary: { kpis: ExecutiveCustomerKpi[] };
  metadataVersion: string;
};

export type DashboardWidget = {
  widgetId: string;
  widgetType: WidgetType;
  label: string;
  value: number | string;
  status: "ready" | "degraded" | "unavailable";
  lastUpdated: string;
};

export type DashboardFailure = {
  failureId: string;
  timestamp: string;
  dashboardId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
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

export type ExecutiveCustomerDashboardRunReport = {
  dashboardRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "refresh_dashboard"
    | "display_growth"
    | "display_activity"
    | "display_lifetime_value"
    | "display_segmentation"
    | "display_sentiment"
    | "display_loyalty"
    | "display_journey"
    | "display_risk"
    | "display_support"
    | "aggregate_kpis"
    | "get_widgets"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: ExecutiveCustomerDashboardRecord;
  snapshots: CustomerDashboardSnapshot[];
  widgets: DashboardWidget[];
  failures: DashboardFailure[];
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
  failedSnapshots: number;
  notes: string[];
};

export type DashboardPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  refreshesPerformed: number;
  displaysPerformed: number;
  summariesGenerated: number;
  kpisAggregated: number;
  widgetsServed: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type EcdLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ExecutiveCustomerDashboardState = {
  engineVersion: ExecutiveCustomerDashboardVersion;
  missionId: "R4-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveCustomerDashboardConfiguration;
  latestReport: ExecutiveCustomerDashboardRunReport | null;
  engineRecord: ExecutiveCustomerDashboardRecord | null;
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
  identityEngineConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type ConnectExecutiveCustomerDashboardInput = { forceReconnect?: boolean };
export type RefreshExecutiveCustomerDashboardInput = { forceRefresh?: boolean };
export type GetDashboardWidgetsInput = { widgetTypes?: WidgetType[] };
export type DetectDashboardFailuresInput = { dashboardId?: string };

export type DashboardCustomerData = {
  totalCustomers: number;
  newCustomers: number;
  totalEvents: number;
  purchaseEvents: number;
  supportEvents: number;
  communicationEvents: number;
  activeCustomers: number;
  averageClv: number;
  totalClv: number;
  highValueCustomers: number;
  decliningValueCustomers: number;
  totalSegments: number;
  assignedCustomers: number;
  topSegments: string[];
  averageSentiment: number;
  positiveSentimentCount: number;
  negativeSentimentCount: number;
  neutralSentimentCount: number;
  loyaltyMembers: number;
  averageLoyaltyPoints: number;
  tierDistribution: Record<string, number>;
  journeysMapped: number;
  averageJourneyScore: number;
  dropOffDetected: number;
  frictionDetected: number;
  averageRiskScore: number;
  highRiskCustomers: number;
  mediumRiskCustomers: number;
  lowRiskCustomers: number;
  totalSupportRecords: number;
  resolvedSupportCount: number;
  openSupportCount: number;
  averageResponseTimeMs: number;
  warnings: string[];
};
