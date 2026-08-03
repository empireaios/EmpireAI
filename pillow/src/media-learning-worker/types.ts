import type { MediaLearningWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INSIGHT_CATEGORIES,
  INTEGRATION_TARGETS,
  LEARNING_OUTCOME_KINDS,
  MLW_CAPABILITIES,
  OPERATIONAL_STATES,
  PATTERN_DIMENSIONS,
  PATTERN_OUTCOMES,
  RECOMMENDATION_AREAS,
  RECOMMENDATION_PRIORITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type LearningOutcomeKind = (typeof LEARNING_OUTCOME_KINDS)[number];
export type PatternOutcome = (typeof PATTERN_OUTCOMES)[number];
export type PatternDimension = (typeof PATTERN_DIMENSIONS)[number];
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];
export type RecommendationArea = (typeof RECOMMENDATION_AREAS)[number];
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MediaLearningWorkerCapability = (typeof MLW_CAPABILITIES)[number];

export type ContentPattern = {
  patternId: string;
  outcome: PatternOutcome;
  dimension: PatternDimension;
  summary: string;
  evidenceRefs: string[];
  strength: number;
  outcomeKind: LearningOutcomeKind;
};

export type InsightBlock = {
  insightId: string;
  category: InsightCategory;
  summary: string;
  measuredSignals: string[];
  assumptions: string[];
  confidence: number;
};

export type RecommendedImprovement = {
  recommendationId: string;
  area: RecommendationArea;
  action: string;
  rationale: string;
  priority: RecommendationPriority;
  playbookUpdateRef: string | null;
};

export type PlaybookRecommendationUpdate = {
  updateId: string;
  playbookId: string;
  recommendationText: string;
  sourceLearningReportId: string;
  applied: boolean;
  neverOverwroteHistoricalLearning: true;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Incoming analytics report shape (from Media Analytics Worker or input). */
export type IncomingAnalyticsReport = {
  analyticsReportId?: string;
  mediaId?: string;
  channelId?: string;
  platform?: string;
  views?: number | { value?: number };
  impressions?: number | { value?: number };
  clickThroughRate?: number | { value?: number };
  watchTime?: number | { value?: number };
  retentionMetrics?: { averageViewPercentage?: number };
  engagementMetrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    engagementRate?: number;
  };
  subscriberImpact?: { netSubscribers?: number };
  revenueMetrics?: {
    available?: boolean;
    estimatedRevenueUsd?: number | null;
  };
  performancePatterns?: Array<{
    classification?: string;
    dimension?: string;
    summary?: string;
  }>;
  confidenceScore?: number;
  contentFormat?: string | null;
  topicId?: string | null;
  hookReportId?: string | null;
  publishingReportId?: string | null;
};

/** Machine-readable Media Learning Report (Q4-16). */
export type MediaLearningReport = {
  learningReportId: string;
  timestamp: string;
  channelId: string;
  mediaIdsAnalysed: string[];
  successfulPatterns: ContentPattern[];
  failedPatterns: ContentPattern[];
  topicInsights: InsightBlock[];
  hookInsights: InsightBlock[];
  thumbnailInsights: InsightBlock[];
  retentionInsights: InsightBlock[];
  publishingInsights: InsightBlock[];
  recommendedImprovements: RecommendedImprovement[];
  playbookRecommendationUpdates: PlaybookRecommendationUpdate[];
  confidenceScore: number;
  metadataVersion: string;
  workerId: string;
  reportVersion: string;
  analyticsReportIds: string[];
  mediaBusinessId?: string | null;
  learningTraceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  historicalLearningRecordIds: string[];
  verifiedAnalyticsOnly: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteExistingContent: true;
  neverModifyPublishedVideos: true;
  neverChangeEditorialPolicyDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ417OrLater: true;
  neverOverwriteHistoricalLearning: true;
  learnOnlyFromVerifiedAnalytics: true;
  preserveCompleteTraceability: true;
  preserveHistoricalLearningRecords: true;
  distinguishMeasuredOutcomesFromAssumptions: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type MediaLearningWorkerInput = {
  learningReportId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  mediaIds?: string[] | null;
  analyticsReportIds?: string[] | null;
  analyticsReports?: IncomingAnalyticsReport[] | null;
  topicIds?: string[] | null;
  hookReportIds?: string[] | null;
  thumbnailIds?: string[] | null;
  contentFormats?: string[] | null;
  publishingTimingNotes?: string | null;
  /** Default true; if false → fail. */
  verifiedAnalytics?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  rewriteExistingContent?: boolean;
  modifyPublishedVideos?: boolean;
  changeEditorialPolicyDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ417OrLater?: boolean;
  overwriteHistoricalLearning?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MediaLearningWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MediaLearningWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MLW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MediaLearningWorkerCapability[];
  totalLearningReports: number;
  lastLearningReportId: string | null;
  lastChannelId: string | null;
  lastConfidenceScore: number | null;
  lastVerifiedAnalyticsOnly: boolean | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MediaLearningWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  learningReports: MediaLearningReport[];
  integrations: IntegrationHandshake[];
  learningOutcomeKinds: LearningOutcomeKind[];
  patternDimensions: PatternDimension[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRewriteExistingContent: true;
  neverModifyPublishedVideos: true;
  neverChangeEditorialPolicyDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ417OrLater: true;
  neverOverwriteHistoricalLearning: true;
  learnOnlyFromVerifiedAnalytics: true;
};

export type MediaLearningWorkerRunReport = {
  learningRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_media_analytics_reports"
    | "identify_successful_content_patterns"
    | "identify_unsuccessful_content_patterns"
    | "analyse_topic_performance"
    | "analyse_hook_performance"
    | "analyse_thumbnail_performance"
    | "analyse_pacing_and_retention"
    | "analyse_publishing_timing"
    | "generate_reusable_learning_insights"
    | "update_media_playbook_recommendations"
    | "produce_media_learning_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MediaLearningWorkerEngineRecord;
  catalog: MediaLearningWorkerCatalog | null;
  learningReports: MediaLearningReport[];
  latestLearningReport: MediaLearningReport | null;
  integrations: IntegrationHandshake[];
  validation: MediaLearningWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MediaLearningWorkerState = {
  engineVersion: "PILLOW-MLW-001";
  missionId: "Q4-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: MediaLearningWorkerConfiguration;
  latestReport: MediaLearningWorkerRunReport | null;
  engineRecord: MediaLearningWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalLearningReports: number;
    lastLearningReportId: string | null;
    lastChannelId: string | null;
    lastConfidenceScore: number | null;
    lastVerifiedAnalyticsOnly: boolean | null;
    notes: string[];
  };
};

export type MediaLearningWorkerCockpitSnapshot = {
  missionId: "Q4-16";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalLearningReports: number;
  latestLearningReportId: string | null;
  lastChannelId: string | null;
  lastConfidenceScore: number | null;
  lastVerifiedAnalyticsOnly: boolean | null;
  workerId: string;
  neverRewriteExistingContent: true;
  neverModifyPublishedVideos: true;
  neverChangeEditorialPolicyDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ417OrLater: true;
  neverOverwriteHistoricalLearning: true;
  learnOnlyFromVerifiedAnalytics: true;
};

export type LearningContext = {
  channelId?: string | null;
  mediaBusinessId?: string | null;
  mediaIds?: string[];
  analyticsReportIds?: string[];
  analyticsReports?: IncomingAnalyticsReport[];
  topicIds?: string[];
  hookReportIds?: string[];
  thumbnailIds?: string[];
  contentFormats?: string[];
  publishingTimingNotes?: string | null;
  verifiedAnalytics?: boolean;
  receivedAnalytics?: boolean;
  successfulPatterns?: ContentPattern[];
  failedPatterns?: ContentPattern[];
  topicInsights?: InsightBlock[];
  hookInsights?: InsightBlock[];
  thumbnailInsights?: InsightBlock[];
  retentionInsights?: InsightBlock[];
  publishingInsights?: InsightBlock[];
  recommendedImprovements?: RecommendedImprovement[];
  playbookRecommendationUpdates?: PlaybookRecommendationUpdate[];
  historicalLearningRecordIds?: string[];
};
