/** PILLOW-MAD-001 — Marketing Analytics Dashboard types (R5-10). */

import type {
  DASHBOARD_WIDGETS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MAD_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";

export type MarketingAnalyticsDashboardEngineVersion = "PILLOW-MAD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number];
export type MadCapability = (typeof MAD_CAPABILITIES)[number];
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
  supportedCapabilities: MadCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    seoIntelligence: boolean;
    campaignManager: boolean;
    audienceIntelligence: boolean;
    attributionEngine: boolean;
  };
  metadataVersion: string;
};

export type CampaignSummary = {
  totalCampaigns: number;
  activeCampaigns: number;
  failedCampaigns: number;
  channelsConnected: number;
};

export type AdvertisingSpendSummary = {
  totalSpend: number;
  currency: "USD";
  byChannel: Record<string, number>;
};

export type TrafficSummary = {
  impressions: number;
  clicks: number;
  clickThroughRate: number;
};

export type ConversionSummary = {
  conversions: number;
  conversionRate: number;
};

export type RoiSummary = {
  roas: number;
  marketingRoiPercent: number;
  attributedRevenue: number;
};

export type AudienceSummary = {
  totalAudiences: number;
  averageQualityScore: number;
  averageEngagementScore: number;
};

export type SeoSummary = {
  keywordsTracked: number;
  averageRankingScore: number;
  organicPerformanceScore: number;
};

export type KpiSummary = {
  campaignPerformanceScore: number;
  spendEfficiencyScore: number;
  trafficScore: number;
  conversionScore: number;
  roiScore: number;
  audienceScore: number;
  seoScore: number;
  overallScore: number;
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

export type DashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  campaignSummary: CampaignSummary;
  advertisingSpendSummary: AdvertisingSpendSummary;
  trafficSummary: TrafficSummary;
  conversionSummary: ConversionSummary;
  roiSummary: RoiSummary;
  audienceSummary: AudienceSummary;
  seoSummary: SeoSummary;
  kpiSummary: KpiSummary;
  widgets: DashboardWidget[];
  executiveSummary: string;
  alerts: string[];
  validationStatus: ValidationStatus;
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

export type DashboardRunReport = {
  dashboardRunReportId: string;
  runTimestamp: string;
  action: "connect" | "refresh_dashboard" | "aggregate_kpis" | "generate_executive_summary";
  engineRecord: DashboardEngineRecord;
  snapshot: DashboardSnapshot | null;
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
  executiveSummariesGenerated: number;
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

export type MarketingAnalyticsDashboardState = {
  engineVersion: MarketingAnalyticsDashboardEngineVersion;
  missionId: "R5-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketingAnalyticsDashboardConfiguration;
  latestReport: DashboardRunReport | null;
  engineRecord: DashboardEngineRecord | null;
  latestSnapshot: DashboardSnapshot | null;
  health: DashboardHealthReport;
  performance: DashboardPerformanceStats;
};

export type DashboardCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: DashboardValidationReport["decision"] | null;
  dashboardRefreshes: number;
  latestOverallScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectDashboardInput = {
  forceReconnect?: boolean;
  authorized?: boolean;
};

export type RefreshDashboardInput = {
  authorized?: boolean;
  includeAlerts?: boolean;
};

export type AggregateKpisInput = {
  authorized?: boolean;
};

export type GenerateExecutiveSummaryInput = {
  authorized?: boolean;
};
