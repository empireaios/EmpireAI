import type { ThumbnailWorkerConfiguration } from "./configuration.js";
import type {
  CONTENT_FORMATS,
  DESIGN_ELEMENTS,
  EMOTIONAL_TRIGGERS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  THW_CAPABILITIES,
  INTEGRATION_TARGETS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type DesignElement = (typeof DESIGN_ELEMENTS)[number];
export type EmotionalTriggerType = (typeof EMOTIONAL_TRIGGERS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ThumbnailWorkerCapability = (typeof THW_CAPABILITIES)[number];

export type ThumbnailConcept = {
  conceptId: string;
  title: string;
  subjectFocus: string;
  composition: string;
  textOverlay: string;
  emotionalTrigger: EmotionalTriggerType;
  contrast: string;
  colourGuidance: string;
  visualHierarchy: string;
  curiosityElement: string;
  brandingConsistency: string;
  rationale: string;
};

export type AbVariant = {
  variantId: string;
  baseConceptId: string;
  label: "A" | "B" | "C";
  textOverlay: string;
  emotionalTrigger: EmotionalTriggerType;
  composition: string;
  differentiation: string;
};

export type TextOverlaySuggestion = {
  overlayId: string;
  text: string;
  placement: string;
  maxCharacters: number;
  rationale: string;
};

export type EmotionalTriggerEntry = {
  triggerId: string;
  trigger: EmotionalTriggerType;
  expression: string;
  placement: string;
  rationale: string;
};

export type CompositionGuidance = {
  framing: string;
  focalPoint: string;
  negativeSpace: string;
  aspectRatio: string;
  safeZoneNotes: string;
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

/** Machine-readable Thumbnail Report (Q4-07). */
export type ThumbnailReport = {
  thumbnailReportId: string;
  timestamp: string;
  scriptId: string;
  channelId: string;
  hookReportId: string | null;
  topicId: string;
  contentFormat: ContentFormat;
  thumbnailConcepts: ThumbnailConcept[];
  primaryConcept: ThumbnailConcept;
  abVariants: AbVariant[];
  textOverlays: TextOverlaySuggestion[];
  emotionalTriggers: EmotionalTriggerEntry[];
  compositionGuidance: CompositionGuidance;
  scriptConsistencyStatus: "aligned" | "partial" | "misaligned";
  brandingNotes: string;
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
  neverGenerateFinalArtwork: true;
  neverEditImagesDirectly: true;
  neverPublishThumbnails: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ408OrLater: true;
  neverUseMisleadingOrDeceptiveThumbnails: true;
  followEditorInChiefStrategy: true;
  remainConsistentWithApprovedScript: true;
  produceMultipleDesignAlternatives: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ThumbnailWorkerInput = {
  thumbnailReportId?: string | null;
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  contentFormat?: ContentFormat | string | null;
  scriptTitle?: string | null;
  scriptIntent?: string | null;
  hookReportId?: string | null;
  primaryHookText?: string | null;
  alternativeHookTexts?: string[] | null;
  editorialStrategy?: string | null;
  channelIdentity?: string | null;
  targetAudience?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  generateFinalArtwork?: boolean;
  editImagesDirectly?: boolean;
  publishThumbnails?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ408OrLater?: boolean;
  useMisleadingThumbnails?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ThumbnailWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ThumbnailWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-THW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ThumbnailWorkerCapability[];
  totalThumbnailReports: number;
  lastThumbnailReportId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ThumbnailWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  thumbnailReports: ThumbnailReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverGenerateFinalArtwork: true;
  neverEditImagesDirectly: true;
  neverPublishThumbnails: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ThumbnailWorkerRunReport = {
  thumbnailRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_script"
    | "receive_approved_hooks"
    | "generate_thumbnail_concepts"
    | "generate_emotional_triggers"
    | "generate_text_overlay_suggestions"
    | "recommend_composition_and_framing"
    | "generate_ab_variants"
    | "validate_script_consistency"
    | "self_review_thumbnail_quality"
    | "produce_thumbnail_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ThumbnailWorkerEngineRecord;
  catalog: ThumbnailWorkerCatalog | null;
  thumbnailReports: ThumbnailReport[];
  latestThumbnailReport: ThumbnailReport | null;
  integrations: IntegrationHandshake[];
  validation: ThumbnailWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ThumbnailWorkerState = {
  engineVersion: "PILLOW-THW-001";
  missionId: "Q4-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: ThumbnailWorkerConfiguration;
  latestReport: ThumbnailWorkerRunReport | null;
  engineRecord: ThumbnailWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalThumbnailReports: number;
    lastThumbnailReportId: string | null;
    lastScriptId: string | null;
    lastContentFormat: ContentFormat | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ThumbnailWorkerCockpitSnapshot = {
  missionId: "Q4-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalThumbnailReports: number;
  latestThumbnailReportId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverGenerateFinalArtwork: true;
  neverEditImagesDirectly: true;
  neverPublishThumbnails: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ThumbnailContext = {
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  scriptTitle?: string | null;
  scriptIntent?: string | null;
  hookReportId?: string | null;
  primaryHookText?: string | null;
  alternativeHookTexts?: string[];
  editorialStrategy?: string | null;
  channelIdentity?: string | null;
  targetAudience?: string | null;
  contentFormat?: ContentFormat | null;
  receivedScript?: boolean;
  receivedHooks?: boolean;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  scriptConsistencyStatus: "aligned" | "partial" | "misaligned";
  brandingNotes: string;
};
