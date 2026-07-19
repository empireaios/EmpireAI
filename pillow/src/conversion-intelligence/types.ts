/** PILLOW-CVI-001 — Conversion Intelligence types (R5-14). */

import type {
  CVI_CAPABILITIES,
  ENGINE_STATUSES,
  FUNNEL_STAGES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ConversionIntelligenceConfiguration } from "./configuration.js";

export type ConversionIntelligenceVersion = "PILLOW-CVI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type FunnelStage = (typeof FUNNEL_STAGES)[number];
export type CviCapability = (typeof CVI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ConversionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CviCapability[];
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
    marketingAnalyticsDashboard: boolean;
    aiCampaignGenerator: boolean;
    budgetOptimizationEngine: boolean;
  };
  metadataVersion: string;
};

export type ConversionRecord = {
  conversionRecordId: string;
  timestamp: string;
  campaignReference: string | null;
  marketingChannel: MarketingChannel;
  funnelStage: FunnelStage;
  conversionRate: number;
  dropOffRate: number;
  conversionEfficiencyScore: number;
  landingPageScore: number;
  bottleneckDetected: boolean;
  abandonmentDetected: boolean;
  recommendedOptimization: string;
  appliedToProductionCampaign: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ConversionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ConversionRunReport = {
  conversionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "track_funnel"
    | "track_drop_off"
    | "measure_landing_page"
    | "measure_campaign_conversion"
    | "measure_channel_conversion"
    | "detect_bottlenecks"
    | "detect_abandonment"
    | "calculate_efficiency"
    | "recommend_improvements"
    | "optimize_funnel";
  engineRecord: ConversionEngineRecord;
  conversionRecords: ConversionRecord[];
  validation: ConversionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ConversionHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ConversionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalConversionRecords: number;
  averageConversionRate: number;
  notes: string[];
};

export type ConversionPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  funnelsTracked: number;
  optimizationsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ConversionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ConversionIntelligenceState = {
  engineVersion: ConversionIntelligenceVersion;
  missionId: "R5-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: ConversionIntelligenceConfiguration;
  latestReport: ConversionRunReport | null;
  engineRecord: ConversionEngineRecord | null;
  health: ConversionHealthReport;
  performance: ConversionPerformanceStats;
};

export type ConversionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ConversionValidationReport["decision"] | null;
  totalConversionRecords: number;
  averageConversionRate: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectConversionIntelligenceInput = {
  forceReconnect?: boolean;
};

export type TrackFunnelInput = {
  campaignReference?: string;
  marketingChannel: MarketingChannel;
  funnelStage?: FunnelStage;
  conversionRate?: number;
  dropOffRate?: number;
  landingPageScore?: number;
};

export type MeasureConversionInput = {
  conversionRecordId?: string;
  campaignReference?: string;
  marketingChannel?: MarketingChannel;
};

export type OptimizeFunnelInput = {
  campaignReference?: string;
  validated?: boolean;
};

export type RecommendImprovementsInput = {
  conversionRecordId?: string;
};
