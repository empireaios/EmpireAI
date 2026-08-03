import type { TrendResearchWorkerConfiguration } from "./configuration.js";
import type {
  DEMAND_LEVELS,
  DISCOVERY_SOURCES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRIORITY_LEVELS,
  TRW_CAPABILITIES,
  TREND_CATEGORIES,
  TREND_DIRECTIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type TrendCategory = (typeof TREND_CATEGORIES)[number];
export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type DemandLevel = (typeof DEMAND_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type TrendResearchWorkerCapability = (typeof TRW_CAPABILITIES)[number];

export type SignalScore = {
  score: number;
  level: string;
  note: string;
};

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Trend Research Report (Q4-03). */
export type TrendResearchReport = {
  trendReportId: string;
  timestamp: string;
  channelId: string;
  trendCategory: TrendCategory;
  trendTopic: string;
  discoverySource: DiscoverySource;
  searchDemand: SignalScore;
  socialSignals: SignalScore;
  competitorActivity: SignalScore;
  currentEventRelevance: SignalScore;
  audienceBehaviour?: SignalScore;
  confidenceScore: number;
  supportingEvidence: EvidenceItem[];
  recommendedPriority: PriorityLevel;
  metadataVersion: string;
  mediaBusinessId: string;
  mediaMissionId: string;
  trendDirection: TrendDirection;
  opportunityCategory: string;
  evidenceKinds: EvidenceKind[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverSelectPublishingTopics: true;
  neverWriteScripts: true;
  neverGenerateThumbnails: true;
  neverPublishContent: true;
  neverGenerateContentDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ404OrLater: true;
  useApprovedResearchSourcesOnly: true;
  preserveCompleteSourceTraceability: true;
  preserveHistoricalTrendRecords: true;
  distinguishFactsFromAssumptions: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type TrendResearchWorkerInput = {
  trendReportId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  mediaMissionId?: string | null;
  trendCategory?: TrendCategory | string | null;
  trendTopic?: string | null;
  discoverySource?: DiscoverySource | string | null;
  searchDemandScore?: number | null;
  searchDemandLevel?: DemandLevel | string | null;
  socialSignalScore?: number | null;
  socialSignalNotes?: string | null;
  competitorActivityScore?: number | null;
  competitorNotes?: string | null;
  currentEventRelevanceScore?: number | null;
  currentEventNotes?: string | null;
  audienceBehaviourScore?: number | null;
  audienceNotes?: string | null;
  confidenceScore?: number | null;
  supportingEvidence?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  recommendedPriority?: PriorityLevel | string | null;
  trendDirection?: TrendDirection | string | null;
  opportunityCategory?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  selectPublishingTopics?: boolean;
  writeScripts?: boolean;
  generateThumbnails?: boolean;
  publishContent?: boolean;
  generateContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ404OrLater?: boolean;
  useUnapprovedSource?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type TrendResearchWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TrendResearchWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-TRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TrendResearchWorkerCapability[];
  totalTrendReports: number;
  lastTrendReportId: string | null;
  lastTrendDirection: TrendDirection | null;
  lastConfidenceScore: number | null;
  lastRecommendedPriority: PriorityLevel | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type TrendResearchWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  trendReports: TrendResearchReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverSelectPublishingTopics: true;
  neverWriteScripts: true;
  neverGenerateThumbnails: true;
  neverPublishContent: true;
  neverGenerateContentDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type TrendResearchWorkerRunReport = {
  trendRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_search_trends"
    | "monitor_competitor_channels"
    | "monitor_social_platform_trends"
    | "monitor_audience_behaviour_signals"
    | "monitor_current_events"
    | "identify_emerging_trends"
    | "identify_declining_trends"
    | "categorize_opportunities"
    | "score_trend_confidence"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: TrendResearchWorkerEngineRecord;
  catalog: TrendResearchWorkerCatalog | null;
  trendReports: TrendResearchReport[];
  latestTrendReport: TrendResearchReport | null;
  integrations: IntegrationHandshake[];
  validation: TrendResearchWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TrendResearchWorkerState = {
  engineVersion: "PILLOW-TRW-001";
  missionId: "Q4-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: TrendResearchWorkerConfiguration;
  latestReport: TrendResearchWorkerRunReport | null;
  engineRecord: TrendResearchWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalTrendReports: number;
    lastTrendReportId: string | null;
    lastTrendDirection: TrendDirection | null;
    lastConfidenceScore: number | null;
    lastRecommendedPriority: PriorityLevel | null;
    notes: string[];
  };
};

export type TrendResearchWorkerCockpitSnapshot = {
  missionId: "Q4-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalTrendReports: number;
  latestTrendReportId: string | null;
  lastTrendDirection: TrendDirection | null;
  lastConfidenceScore: number | null;
  lastRecommendedPriority: PriorityLevel | null;
  workerId: string;
  neverSelectPublishingTopics: true;
  neverWriteScripts: true;
  neverGenerateThumbnails: true;
  neverPublishContent: true;
  neverGenerateContentDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
