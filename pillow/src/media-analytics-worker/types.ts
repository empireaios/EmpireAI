import type { MediaAnalyticsWorkerConfiguration } from "./configuration.js";
import type {
  ANALYTICS_PLATFORMS,
  COMPARISON_DIMENSIONS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MAW_CAPABILITIES,
  METRIC_SOURCES,
  OPERATIONAL_STATES,
  PATTERN_CLASSIFICATIONS,
  PATTERN_DIMENSIONS,
  PATTERN_SEVERITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AnalyticsPlatform = (typeof ANALYTICS_PLATFORMS)[number];
export type MetricSource = (typeof METRIC_SOURCES)[number];
export type PatternClassification = (typeof PATTERN_CLASSIFICATIONS)[number];
export type PatternDimension = (typeof PATTERN_DIMENSIONS)[number];
export type ComparisonDimension = (typeof COMPARISON_DIMENSIONS)[number];
export type PatternSeverity = (typeof PATTERN_SEVERITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MediaAnalyticsWorkerCapability = (typeof MAW_CAPABILITIES)[number];

export type MetricValue = {
  value: number;
  unit: string;
  source: MetricSource;
  asOf: string;
};

export type RetentionMetrics = {
  averageViewPercentage: number;
  retainedAt25Pct: number;
  retainedAt50Pct: number;
  retainedAt75Pct: number;
  retainedAt100Pct: number;
  source: MetricSource;
};

export type SubscriberImpact = {
  netSubscribers: number;
  subscribersGained: number;
  subscribersLost: number;
  source: MetricSource;
};

export type EngagementMetrics = {
  likes: number;
  comments: number;
  shares: number;
  /** Percentage 0–100 for clarity. */
  engagementRate: number;
  source: MetricSource;
};

export type RevenueMetrics = {
  available: boolean;
  estimatedRevenueUsd: number | null;
  currency: "USD";
  source: MetricSource;
  notes: string;
};

export type PerformancePattern = {
  patternId: string;
  classification: PatternClassification;
  dimension: PatternDimension;
  summary: string;
  evidenceRefs: string[];
  severity: PatternSeverity;
};

export type ComparisonEntry = {
  comparisonId: string;
  leftId: string;
  rightId: string;
  dimension: ComparisonDimension;
  winnerId: string | null;
  deltaSummary: string;
  metricsCompared: string[];
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Media Analytics Report (Q4-15). */
export type MediaAnalyticsReport = {
  analyticsReportId: string;
  timestamp: string;
  mediaBusinessId: string;
  channelId: string;
  mediaId: string;
  platform: AnalyticsPlatform;
  views: MetricValue;
  impressions: MetricValue;
  clickThroughRate: MetricValue;
  watchTime: MetricValue;
  retentionMetrics: RetentionMetrics;
  subscriberImpact: SubscriberImpact;
  engagementMetrics: EngagementMetrics;
  revenueMetrics: RevenueMetrics;
  performancePatterns: PerformancePattern[];
  comparisons: ComparisonEntry[];
  confidenceScore: number;
  metadataVersion: string;
  workerId: string;
  reportVersion: string;
  contentFormat?: string | null;
  topicId?: string | null;
  hookReportId?: string | null;
  publishingReportId?: string | null;
  metricTraceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  historicalSnapshotIds: string[];
  meaningfulChangeDetected: boolean;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteContent: true;
  neverChangePublishingSchedules: true;
  neverModifyChannelStrategy: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ416OrLater: true;
  neverAlterSourceAnalyticsData: true;
  preserveCompleteMetricTraceability: true;
  preserveHistoricalPerformanceRecords: true;
  distinguishPlatformReportedFromEstimates: true;
  detectMeaningfulPerformanceChanges: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ComparisonTargetInput = {
  id: string;
  dimension: string;
  views?: number;
  ctr?: number;
  retention?: number;
};

export type MediaAnalyticsWorkerInput = {
  analyticsReportId?: string | null;
  mediaBusinessId?: string | null;
  channelId?: string | null;
  mediaId?: string | null;
  platform?: AnalyticsPlatform | string | null;
  publishingReportId?: string | null;
  views?: number | null;
  impressions?: number | null;
  clickThroughRate?: number | null;
  watchTimeHours?: number | null;
  averageViewPercentage?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  subscribersGained?: number | null;
  subscribersLost?: number | null;
  estimatedRevenueUsd?: number | null;
  revenueAvailable?: boolean | null;
  contentFormat?: string | null;
  topicId?: string | null;
  hookReportId?: string | null;
  topicTitle?: string | null;
  priorViews?: number | null;
  priorCtr?: number | null;
  priorRetention?: number | null;
  comparisonTargets?: ComparisonTargetInput[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  rewriteContent?: boolean;
  changePublishingSchedules?: boolean;
  modifyChannelStrategy?: boolean;
  executeOptimizations?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ416OrLater?: boolean;
  alterSourceAnalyticsData?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MediaAnalyticsWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MediaAnalyticsWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MAW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MediaAnalyticsWorkerCapability[];
  totalAnalyticsReports: number;
  lastAnalyticsReportId: string | null;
  lastMediaId: string | null;
  lastPlatform: AnalyticsPlatform | null;
  lastConfidenceScore: number | null;
  lastMeaningfulChangeDetected: boolean | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MediaAnalyticsWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  analyticsReports: MediaAnalyticsReport[];
  integrations: IntegrationHandshake[];
  supportedPlatforms: AnalyticsPlatform[];
  metricSources: MetricSource[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRewriteContent: true;
  neverChangePublishingSchedules: true;
  neverModifyChannelStrategy: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ416OrLater: true;
  neverAlterSourceAnalyticsData: true;
};

export type MediaAnalyticsWorkerRunReport = {
  analyticsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_platform_metrics"
    | "track_views"
    | "track_impressions"
    | "track_click_through_rate"
    | "track_watch_time"
    | "track_audience_retention"
    | "track_subscriber_growth"
    | "track_engagement_metrics"
    | "track_revenue_where_available"
    | "detect_performance_patterns"
    | "compare_videos_formats_topics_hooks_channels"
    | "produce_media_analytics_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MediaAnalyticsWorkerEngineRecord;
  catalog: MediaAnalyticsWorkerCatalog | null;
  analyticsReports: MediaAnalyticsReport[];
  latestAnalyticsReport: MediaAnalyticsReport | null;
  integrations: IntegrationHandshake[];
  validation: MediaAnalyticsWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MediaAnalyticsWorkerState = {
  engineVersion: "PILLOW-MAW-001";
  missionId: "Q4-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: MediaAnalyticsWorkerConfiguration;
  latestReport: MediaAnalyticsWorkerRunReport | null;
  engineRecord: MediaAnalyticsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAnalyticsReports: number;
    lastAnalyticsReportId: string | null;
    lastMediaId: string | null;
    lastPlatform: AnalyticsPlatform | null;
    lastConfidenceScore: number | null;
    lastMeaningfulChangeDetected: boolean | null;
    notes: string[];
  };
};

export type MediaAnalyticsWorkerCockpitSnapshot = {
  missionId: "Q4-15";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAnalyticsReports: number;
  latestAnalyticsReportId: string | null;
  lastMediaId: string | null;
  lastPlatform: AnalyticsPlatform | null;
  lastConfidenceScore: number | null;
  lastMeaningfulChangeDetected: boolean | null;
  workerId: string;
  neverRewriteContent: true;
  neverChangePublishingSchedules: true;
  neverModifyChannelStrategy: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ416OrLater: true;
  neverAlterSourceAnalyticsData: true;
};

export type AnalyticsContext = {
  mediaBusinessId?: string | null;
  channelId?: string | null;
  mediaId?: string | null;
  platform?: AnalyticsPlatform | null;
  publishingReportId?: string | null;
  views?: number | null;
  impressions?: number | null;
  clickThroughRate?: number | null;
  watchTimeHours?: number | null;
  averageViewPercentage?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  subscribersGained?: number | null;
  subscribersLost?: number | null;
  estimatedRevenueUsd?: number | null;
  revenueAvailable?: boolean | null;
  contentFormat?: string | null;
  topicId?: string | null;
  hookReportId?: string | null;
  topicTitle?: string | null;
  priorViews?: number | null;
  priorCtr?: number | null;
  priorRetention?: number | null;
  comparisonTargets?: ComparisonTargetInput[];
  receivedMetrics?: boolean;
  performancePatterns?: PerformancePattern[];
  comparisons?: ComparisonEntry[];
  historicalSnapshotIds?: string[];
};
