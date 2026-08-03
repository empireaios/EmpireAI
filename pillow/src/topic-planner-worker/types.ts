import type { TopicPlannerWorkerConfiguration } from "./configuration.js";
import type {
  ALIGNMENT_LEVELS,
  CADENCE_STATUSES,
  CONTENT_MIX,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  TOPIC_PRIORITIES,
  TPW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type TopicPriority = (typeof TOPIC_PRIORITIES)[number];
export type ContentMix = (typeof CONTENT_MIX)[number];
export type CadenceStatus = (typeof CADENCE_STATUSES)[number];
export type AlignmentLevel = (typeof ALIGNMENT_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type TopicPlannerWorkerCapability = (typeof TPW_CAPABILITIES)[number];

export type SelectedTopic = {
  topicId: string;
  title: string;
  priority: TopicPriority;
  contentMix: ContentMix;
  selectionReason: string;
  editorialAlignmentScore: number;
  trendAlignmentScore: number;
  expectedAudience: string;
  confidenceScore: number;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type CompactTrendInput = {
  trendReportId?: string | null;
  trendTopic?: string | null;
  confidenceScore?: number | null;
  recommendedPriority?: string | null;
  trendDirection?: string | null;
};

/** Machine-readable Topic Plan (Q4-04). */
export type TopicPlan = {
  topicPlanId: string;
  timestamp: string;
  channelId: string;
  publishingDate: string;
  selectedTopics: SelectedTopic[];
  topicPriority: TopicPriority;
  selectionReason: string;
  editorialAlignment: AlignmentLevel;
  trendAlignment: AlignmentLevel;
  expectedAudience: string;
  confidenceScore: number;
  metadataVersion: string;
  mediaBusinessId: string;
  editorialReportId: string | null;
  trendReportIds: string[];
  cadenceStatus: CadenceStatus;
  evergreenCount: number;
  trendingCount: number;
  duplicatePreventionApplied: boolean;
  rankedTopics: SelectedTopic[];
  workerId: string;
  planVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  pillowGovernanceConfirmed: boolean;
  neverWriteScripts: true;
  neverGenerateVisuals: true;
  neverProduceVideos: true;
  neverPublishContent: true;
  neverBypassPillowGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ405OrLater: true;
  neverRequireGrandKingDailyPrompts: true;
  followEditorInChiefStrategy: true;
  useTrendResearchEvidence: true;
  preserveCompletePlanningTraceability: true;
  avoidDuplicateOrConflictingTopics: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type TopicPlannerWorkerInput = {
  topicPlanId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  publishingDate?: string | null;
  editorialStrategy?: string | null;
  channelIdentity?: string | null;
  targetAudience?: string | null;
  editorialTone?: string | null;
  contentPriorities?: string[] | null;
  editorialReportId?: string | null;
  trendReports?: CompactTrendInput[] | null;
  trendTopics?: string[] | null;
  channelObjectives?: string[] | null;
  candidateTopics?: Array<string | { title?: string; topicId?: string; contentMix?: ContentMix | string }> | null;
  dailyTopicCount?: number | null;
  evergreenRatio?: number | null;
  pillowGovernanceConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  writeScripts?: boolean;
  generateVisuals?: boolean;
  produceVideos?: boolean;
  publishContent?: boolean;
  bypassPillowGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ405OrLater?: boolean;
  requireGrandKingDailyPrompt?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type TopicPlannerWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TopicPlannerWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-TPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TopicPlannerWorkerCapability[];
  totalTopicPlans: number;
  lastTopicPlanId: string | null;
  lastTopicPriority: TopicPriority | null;
  lastCadenceStatus: CadenceStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type TopicPlannerWorkerCatalog = {
  planVersion: string;
  workerId: string;
  topicPlans: TopicPlan[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverWriteScripts: true;
  neverGenerateVisuals: true;
  neverProduceVideos: true;
  neverPublishContent: true;
  neverBypassPillowGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type TopicPlannerWorkerRunReport = {
  topicRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_editorial_strategy"
    | "receive_trend_research_reports"
    | "analyse_channel_objectives"
    | "prioritize_content_opportunities"
    | "select_daily_publishing_topics"
    | "balance_evergreen_and_trending"
    | "prevent_duplicate_topics"
    | "maintain_publishing_cadence"
    | "rank_topics_by_strategic_priority"
    | "produce_topic_plan"
    | "submit_plan"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: TopicPlannerWorkerEngineRecord;
  catalog: TopicPlannerWorkerCatalog | null;
  topicPlans: TopicPlan[];
  latestTopicPlan: TopicPlan | null;
  integrations: IntegrationHandshake[];
  validation: TopicPlannerWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TopicPlannerWorkerState = {
  engineVersion: "PILLOW-TPW-001";
  missionId: "Q4-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: TopicPlannerWorkerConfiguration;
  latestReport: TopicPlannerWorkerRunReport | null;
  engineRecord: TopicPlannerWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalTopicPlans: number;
    lastTopicPlanId: string | null;
    lastTopicPriority: TopicPriority | null;
    lastCadenceStatus: CadenceStatus | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type TopicPlannerWorkerCockpitSnapshot = {
  missionId: "Q4-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalTopicPlans: number;
  latestTopicPlanId: string | null;
  lastTopicPriority: TopicPriority | null;
  lastCadenceStatus: CadenceStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverWriteScripts: true;
  neverGenerateVisuals: true;
  neverProduceVideos: true;
  neverPublishContent: true;
  neverBypassPillowGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PlanningContext = {
  editorialStrategy?: string | null;
  editorialReportId?: string | null;
  channelIdentity?: string | null;
  targetAudience?: string | null;
  editorialTone?: string | null;
  contentPriorities?: string[];
  trendReports?: CompactTrendInput[];
  channelObjectives?: string[];
  receivedEditorial?: boolean;
  receivedTrends?: boolean;
};
