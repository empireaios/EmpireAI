import type { HookWorkerConfiguration } from "./configuration.js";
import type {
  CONTENT_FORMATS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  HKW_CAPABILITIES,
  HOOK_TYPES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type HookType = (typeof HOOK_TYPES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type HookWorkerCapability = (typeof HKW_CAPABILITIES)[number];

export type ScriptSectionRef = {
  sectionId: string;
  sectionType: string;
  heading: string;
  narration: string;
};

export type HookEntry = {
  hookId: string;
  hookType: HookType;
  text: string;
  placement: string;
};

export type CuriosityGap = {
  gapId: string;
  text: string;
  placement: string;
};

export type RetentionLoop = {
  loopId: string;
  text: string;
  placement: string;
};

export type ContinuationMoment = {
  momentId: string;
  text: string;
  placement: string;
};

export type PacingRecommendation = {
  recommendationId: string;
  segment: string;
  suggestion: string;
  rationale: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

/** Machine-readable Hook Report (Q4-06). */
export type HookReport = {
  hookReportId: string;
  timestamp: string;
  scriptId: string;
  channelId: string;
  topicId: string;
  contentFormat: ContentFormat;
  primaryHook: HookEntry;
  alternativeHooks: HookEntry[];
  curiosityGaps: CuriosityGap[];
  retentionLoops: RetentionLoop[];
  continuationMoments: ContinuationMoment[];
  pacingRecommendations: PacingRecommendation[];
  engagementRationale: string;
  selfReviewSummary: string;
  confidenceScore: number;
  metadataVersion: string;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteCompleteScript: true;
  neverGenerateThumbnails: true;
  neverGenerateVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ407OrLater: true;
  neverUseMisleadingOrDeceptiveHooks: true;
  preserveApprovedScriptIntent: true;
  generateOriginalHooks: true;
  preserveCompleteTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type HookWorkerInput = {
  hookReportId?: string | null;
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  contentFormat?: ContentFormat | string | null;
  scriptTitle?: string | null;
  scriptSections?: ScriptSectionRef[] | null;
  narrationReadyText?: string | null;
  scriptIntent?: string | null;
  targetAudience?: string | null;
  pillowGovernanceConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  rewriteCompleteScript?: boolean;
  generateThumbnails?: boolean;
  generateVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ407OrLater?: boolean;
  useMisleadingHooks?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type HookWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type HookWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-HKW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: HookWorkerCapability[];
  totalHookReports: number;
  lastHookReportId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type HookWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  hookReports: HookReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRewriteCompleteScript: true;
  neverGenerateThumbnails: true;
  neverGenerateVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type HookWorkerRunReport = {
  hookRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_script"
    | "generate_opening_hooks"
    | "generate_curiosity_gaps"
    | "generate_retention_loops"
    | "generate_continuation_moments"
    | "improve_pacing_recommendations"
    | "improve_audience_engagement"
    | "generate_multiple_hook_alternatives"
    | "self_review_hook_effectiveness"
    | "produce_hook_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: HookWorkerEngineRecord;
  catalog: HookWorkerCatalog | null;
  hookReports: HookReport[];
  latestHookReport: HookReport | null;
  integrations: IntegrationHandshake[];
  validation: HookWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type HookWorkerState = {
  engineVersion: "PILLOW-HKW-001";
  missionId: "Q4-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: HookWorkerConfiguration;
  latestReport: HookWorkerRunReport | null;
  engineRecord: HookWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalHookReports: number;
    lastHookReportId: string | null;
    lastScriptId: string | null;
    lastContentFormat: ContentFormat | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type HookWorkerCockpitSnapshot = {
  missionId: "Q4-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalHookReports: number;
  latestHookReportId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverRewriteCompleteScript: true;
  neverGenerateThumbnails: true;
  neverGenerateVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ScriptContext = {
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  scriptTitle?: string | null;
  scriptSections?: ScriptSectionRef[];
  narrationReadyText?: string | null;
  scriptIntent?: string | null;
  targetAudience?: string | null;
  contentFormat?: ContentFormat | null;
  receivedScript?: boolean;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
};
