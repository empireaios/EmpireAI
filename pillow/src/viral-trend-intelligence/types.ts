/** PILLOW-VTI-001 — Viral Trend Intelligence types (R5-16). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  TREND_CATEGORIES,
  TREND_SOURCES,
  VALIDATION_STATUSES,
  VTI_CAPABILITIES,
} from "./paths.js";
import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";

export type ViralTrendIntelligenceVersion = "PILLOW-VTI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type TrendCategory = (typeof TREND_CATEGORIES)[number];
export type TrendSource = (typeof TREND_SOURCES)[number];
export type VtiCapability = (typeof VTI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TrendEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: VtiCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    seoIntelligence: boolean;
    audienceIntelligence: boolean;
    marketingAnalyticsDashboard: boolean;
    competitorMarketingMonitor: boolean;
  };
  metadataVersion: string;
};

export type TrendRecord = {
  trendRecordId: string;
  timestamp: string;
  trendCategory: TrendCategory;
  trendSource: TrendSource;
  keywordReference: string | null;
  hashtagReference: string | null;
  trendScore: number;
  growthRate: number;
  accelerationDetected: boolean;
  declineDetected: boolean;
  predictedScore: number;
  recommendationSummary: string;
  authorizedPublicSignalsOnly: true;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type TrendValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TrendRunReport = {
  trendRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "discover_trends"
    | "monitor_keywords"
    | "monitor_hashtags"
    | "monitor_products"
    | "monitor_content"
    | "monitor_creators"
    | "detect_acceleration"
    | "detect_decline"
    | "predict_trends"
    | "recommend_trends";
  engineRecord: TrendEngineRecord;
  trendRecords: TrendRecord[];
  validation: TrendValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TrendHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: TrendValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalTrendRecords: number;
  averageTrendScore: number;
  notes: string[];
};

export type TrendPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  discoveriesRun: number;
  monitoringRuns: number;
  predictionsGenerated: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TrendLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ViralTrendIntelligenceState = {
  engineVersion: ViralTrendIntelligenceVersion;
  missionId: "R5-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: ViralTrendIntelligenceConfiguration;
  latestReport: TrendRunReport | null;
  engineRecord: TrendEngineRecord | null;
  health: TrendHealthReport;
  performance: TrendPerformanceStats;
};

export type TrendCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: TrendValidationReport["decision"] | null;
  totalTrendRecords: number;
  averageTrendScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectViralTrendIntelligenceInput = {
  forceReconnect?: boolean;
};

export type DiscoverTrendsInput = {
  seedKeyword?: string;
  trendCategory?: TrendCategory;
  trendSource?: TrendSource;
};

export type MonitorTrendsInput = {
  trendRecordId?: string;
  trendCategory?: TrendCategory;
  trendSource?: TrendSource;
};

export type PredictTrendsInput = {
  trendRecordId?: string;
};

export type RecommendTrendsInput = {
  trendRecordId?: string;
};
