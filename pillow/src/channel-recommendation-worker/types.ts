import type { ChannelRecommendationWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  EVIDENCE_SOURCE_TYPES,
  INTEGRATION_TARGETS,
  CRW_CAPABILITIES,
  OPERATIONAL_STATES,
  RECOMMENDATION_DECISIONS,
  RISK_LEVELS,
  SCORED_DIMENSION_KINDS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type RecommendationDecision = (typeof RECOMMENDATION_DECISIONS)[number];
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type ScoredDimensionKind = (typeof SCORED_DIMENSION_KINDS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ChannelRecommendationWorkerCapability = (typeof CRW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  sourceType: EvidenceSourceType;
  sourceRef: string;
  statement: string;
  kind: EvidenceKind;
};

export type ScoredDimension = {
  score: number;
  summary: string;
  evidenceRefs: string[];
  kind: ScoredDimensionKind;
};

export type RiskAssessment = {
  overallRisk: RiskLevel;
  riskScore: number;
  factors: string[];
  notes: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type RankedOpportunity = {
  recommendationId: string;
  proposedChannelName: string;
  overallScore: number;
  recommendation: RecommendationDecision;
};

export type ProposedChannel = {
  channelName: string;
  platform: string;
  niche: string;
  contentFormat?: string | null;
};

export type TargetAudience = {
  primaryAudience: string;
  audienceSegments: string[];
  geographyHints: string[];
};

export type TrendSignal = {
  trendId?: string;
  topic?: string;
  demandScore?: number;
  competitionLevel?: string;
  summary?: string;
};

export type AnalyticsSignal = {
  analyticsReportId?: string;
  channelId?: string;
  views?: number;
  ctr?: number;
  retention?: number;
  revenueUsd?: number | null;
  confidenceScore?: number;
};

export type LearningSignal = {
  learningReportId?: string;
  channelId?: string;
  successfulPatternCount?: number;
  failedPatternCount?: number;
  confidenceScore?: number;
  topInsight?: string;
};

/** Machine-readable Channel Recommendation Report (Q4-17). */
export type ChannelRecommendationReport = {
  recommendationId: string;
  timestamp: string;
  proposedChannel: ProposedChannel;
  targetAudience: TargetAudience;
  audiencePotential: ScoredDimension;
  revenuePotential: ScoredDimension;
  productionFeasibility: ScoredDimension;
  competitionAssessment: ScoredDimension;
  strategicFit: ScoredDimension;
  contentSustainability: ScoredDimension;
  riskAssessment: RiskAssessment;
  overallScore: number;
  recommendation: RecommendationDecision;
  recommendationRationale: string;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  metadataVersion: string;
  workerId: string;
  reportVersion: string;
  channelIdHint?: string | null;
  mediaBusinessId?: string | null;
  rankingPosition?: number | null;
  rankedOpportunities?: RankedOpportunity[];
  sourceTraceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  neverCreateChannelsAutomatically: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverCreateChannels: true;
  neverConfigurePlatformAccounts: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ418OrLater: true;
  baseRecommendationsOnEvidence: true;
  preserveCompleteSourceTraceability: true;
  distinguishFactsFromAssumptions: true;
  explainEveryRecommendation: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ChannelRecommendationWorkerInput = {
  recommendationId?: string | null;
  proposedChannelName?: string | null;
  platform?: string | null;
  niche?: string | null;
  contentFormat?: string | null;
  targetAudience?: string | null;
  audienceSegments?: string[] | null;
  geographyHints?: string[] | null;
  channelIdHint?: string | null;
  mediaBusinessId?: string | null;
  trendReportIds?: string[] | null;
  analyticsReportIds?: string[] | null;
  learningReportIds?: string[] | null;
  trendSignals?: TrendSignal[] | null;
  analyticsSignals?: AnalyticsSignal[] | null;
  learningSignals?: LearningSignal[] | null;
  audiencePotentialHint?: number | null;
  revenuePotentialHint?: number | null;
  productionFeasibilityHint?: number | null;
  competitionHint?: number | null;
  strategicFitHint?: number | null;
  sustainabilityHint?: number | null;
  existingChannelCount?: number | null;
  productionCapacityScore?: number | null;
  strategicPriorityScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  createChannels?: boolean;
  configurePlatformAccounts?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ418OrLater?: boolean;
  createChannelsAutomatically?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ChannelRecommendationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ChannelRecommendationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ChannelRecommendationWorkerCapability[];
  totalRecommendationReports: number;
  lastRecommendationId: string | null;
  lastProposedChannelName: string | null;
  lastOverallScore: number | null;
  lastRecommendation: RecommendationDecision | null;
  lastNeverCreateChannelsAutomatically: boolean | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ChannelRecommendationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  recommendationReports: ChannelRecommendationReport[];
  integrations: IntegrationHandshake[];
  recommendationDecisions: RecommendationDecision[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverCreateChannels: true;
  neverConfigurePlatformAccounts: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ418OrLater: true;
  neverCreateChannelsAutomatically: true;
  baseRecommendationsOnEvidence: true;
};

export type ChannelRecommendationWorkerRunReport = {
  recommendationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_trend_research"
    | "receive_media_analytics"
    | "receive_media_learning_outputs"
    | "analyse_audience_potential"
    | "analyse_revenue_potential"
    | "analyse_production_feasibility"
    | "analyse_competition"
    | "analyse_strategic_fit"
    | "analyse_expected_content_sustainability"
    | "rank_channel_opportunities"
    | "recommend_proceed_monitor_or_reject"
    | "produce_channel_recommendation_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ChannelRecommendationWorkerEngineRecord;
  catalog: ChannelRecommendationWorkerCatalog | null;
  recommendationReports: ChannelRecommendationReport[];
  latestRecommendationReport: ChannelRecommendationReport | null;
  integrations: IntegrationHandshake[];
  validation: ChannelRecommendationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ChannelRecommendationWorkerState = {
  engineVersion: "PILLOW-CRW-001";
  missionId: "Q4-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: ChannelRecommendationWorkerConfiguration;
  latestReport: ChannelRecommendationWorkerRunReport | null;
  engineRecord: ChannelRecommendationWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRecommendationReports: number;
    lastRecommendationId: string | null;
    lastProposedChannelName: string | null;
    lastOverallScore: number | null;
    lastRecommendation: RecommendationDecision | null;
    lastNeverCreateChannelsAutomatically: boolean | null;
    notes: string[];
  };
};

export type ChannelRecommendationWorkerCockpitSnapshot = {
  missionId: "Q4-17";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRecommendationReports: number;
  latestRecommendationId: string | null;
  lastProposedChannelName: string | null;
  lastOverallScore: number | null;
  lastRecommendation: RecommendationDecision | null;
  lastNeverCreateChannelsAutomatically: boolean | null;
  workerId: string;
  neverCreateChannels: true;
  neverConfigurePlatformAccounts: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ418OrLater: true;
  neverCreateChannelsAutomatically: true;
  baseRecommendationsOnEvidence: true;
};

export type RecommendationContext = {
  proposedChannelName?: string | null;
  platform?: string | null;
  niche?: string | null;
  contentFormat?: string | null;
  targetAudience?: string | null;
  audienceSegments?: string[];
  geographyHints?: string[];
  channelIdHint?: string | null;
  mediaBusinessId?: string | null;
  trendReportIds?: string[];
  analyticsReportIds?: string[];
  learningReportIds?: string[];
  trendSignals?: TrendSignal[];
  analyticsSignals?: AnalyticsSignal[];
  learningSignals?: LearningSignal[];
  audiencePotentialHint?: number | null;
  revenuePotentialHint?: number | null;
  productionFeasibilityHint?: number | null;
  competitionHint?: number | null;
  strategicFitHint?: number | null;
  sustainabilityHint?: number | null;
  existingChannelCount?: number | null;
  productionCapacityScore?: number | null;
  strategicPriorityScore?: number | null;
  receivedTrend?: boolean;
  receivedAnalytics?: boolean;
  receivedLearning?: boolean;
  audiencePotential?: ScoredDimension;
  revenuePotential?: ScoredDimension;
  productionFeasibility?: ScoredDimension;
  competitionAssessment?: ScoredDimension;
  strategicFit?: ScoredDimension;
  contentSustainability?: ScoredDimension;
  recommendation?: RecommendationDecision;
  rankingPosition?: number | null;
  rankedOpportunities?: RankedOpportunity[];
  seedOpportunities?: Array<{
    proposedChannelName?: string;
    platform?: string;
    niche?: string;
    contentFormat?: string | null;
  }>;
};
