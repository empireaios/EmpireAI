/** PILLOW-AUD-001 — Audience Intelligence types (R5-08). */

import type {
  AUD_CAPABILITIES,
  AUDIENCE_SOURCES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AudienceIntelligenceConfiguration } from "./configuration.js";

export type AudienceIntelligenceEngineVersion = "PILLOW-AUD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AudienceSource = (typeof AUDIENCE_SOURCES)[number];
export type AudCapability = (typeof AUD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AudienceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AudCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    customerSegmentation: boolean;
    customerJourney: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    campaignManager: boolean;
  };
  metadataVersion: string;
};

export type AudienceRecord = {
  audienceRecordId: string;
  timestamp: string;
  audienceName: string;
  audienceSource: AudienceSource;
  demographicSummary: string;
  behaviourSummary: string;
  interestSummary: string;
  audienceSize: number;
  audienceQualityScore: number;
  engagementScore: number;
  intentScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  overlapAudienceIds: string[];
  piiRedacted: true;
};

export type AudienceRecommendation = {
  recommendationId: string;
  audienceRecordId: string;
  summary: string;
  priority: "low" | "medium" | "high";
  timestamp: string;
};

export type AudienceOverlap = {
  overlapId: string;
  audienceRecordIdA: string;
  audienceRecordIdB: string;
  overlapPercent: number;
  timestamp: string;
};

export type AudienceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AudienceRunReport = {
  audienceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "build_audience"
    | "analyze_demographics"
    | "analyze_interests"
    | "analyze_behaviour"
    | "analyze_intent"
    | "measure_engagement"
    | "measure_quality"
    | "detect_overlap"
    | "generate_recommendations";
  engineRecord: AudienceEngineRecord;
  audienceRecords: AudienceRecord[];
  overlaps: AudienceOverlap[];
  recommendations: AudienceRecommendation[];
  validation: AudienceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AudienceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AudienceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAudiences: number;
  averageQualityScore: number;
  notes: string[];
};

export type AudiencePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  audiencesBuilt: number;
  analysesRun: number;
  overlapsDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AudienceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AudienceIntelligenceState = {
  engineVersion: AudienceIntelligenceEngineVersion;
  missionId: "R5-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: AudienceIntelligenceConfiguration;
  latestReport: AudienceRunReport | null;
  engineRecord: AudienceEngineRecord | null;
  health: AudienceHealthReport;
  performance: AudiencePerformanceStats;
};

export type AudienceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AudienceValidationReport["decision"] | null;
  audiencesBuilt: number;
  averageQualityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectAudienceIntelligenceInput = {
  forceReconnect?: boolean;
};

export type BuildAudienceInput = {
  audienceName: string;
  audienceSource?: AudienceSource;
  estimatedSize?: number;
  demographicHints?: string[];
  interestHints?: string[];
  behaviourHints?: string[];
};

export type AnalyzeAudienceInput = {
  audienceRecordId: string;
};

export type DetectOverlapInput = {
  audienceRecordId?: string;
};

export type GenerateAudienceRecommendationsInput = {
  audienceRecordId?: string;
};
