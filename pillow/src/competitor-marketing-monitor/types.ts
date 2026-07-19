/** PILLOW-CMM-001 — Competitor Marketing Monitor types (R5-15). */

import type {
  CMM_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CompetitorMarketingMonitorConfiguration } from "./configuration.js";

export type CompetitorMarketingMonitorVersion = "PILLOW-CMM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type CmmCapability = (typeof CMM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CompetitorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CmmCapability[];
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
    marketingAnalyticsDashboard: boolean;
    conversionIntelligence: boolean;
  };
  metadataVersion: string;
};

export type CompetitorRecord = {
  competitorRecordId: string;
  timestamp: string;
  competitorIdentifier: string;
  marketingChannel: MarketingChannel;
  campaignReference: string | null;
  keywordReference: string | null;
  promotionSummary: string;
  competitiveScore: number;
  recommendationSummary: string;
  strategyChangeDetected: boolean;
  emergingCompetitor: boolean;
  authorizedPublicSignalsOnly: true;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type CompetitorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CompetitorRunReport = {
  competitorRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "discover_competitors"
    | "monitor_campaigns"
    | "monitor_advertisements"
    | "monitor_keywords"
    | "monitor_seo_rankings"
    | "monitor_landing_pages"
    | "monitor_promotions"
    | "detect_strategy_changes"
    | "detect_emerging_competitors"
    | "generate_competitive_intelligence";
  engineRecord: CompetitorEngineRecord;
  competitorRecords: CompetitorRecord[];
  validation: CompetitorValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CompetitorHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CompetitorValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCompetitorRecords: number;
  averageCompetitiveScore: number;
  notes: string[];
};

export type CompetitorPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  discoveriesRun: number;
  monitoringRuns: number;
  intelligenceGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CompetitorLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CompetitorMarketingMonitorState = {
  engineVersion: CompetitorMarketingMonitorVersion;
  missionId: "R5-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: CompetitorMarketingMonitorConfiguration;
  latestReport: CompetitorRunReport | null;
  engineRecord: CompetitorEngineRecord | null;
  health: CompetitorHealthReport;
  performance: CompetitorPerformanceStats;
};

export type CompetitorCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CompetitorValidationReport["decision"] | null;
  totalCompetitorRecords: number;
  averageCompetitiveScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCompetitorMarketingMonitorInput = {
  forceReconnect?: boolean;
};

export type DiscoverCompetitorsInput = {
  seedIdentifier?: string;
  marketingChannel?: MarketingChannel;
};

export type MonitorCompetitorsInput = {
  competitorRecordId?: string;
  competitorIdentifier?: string;
  marketingChannel?: MarketingChannel;
};

export type GenerateIntelligenceInput = {
  competitorRecordId?: string;
};
