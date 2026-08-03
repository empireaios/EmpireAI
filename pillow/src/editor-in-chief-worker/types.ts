import type { EditorInChiefWorkerConfiguration } from "./configuration.js";

import type {

  APPROVAL_STATUSES,

  BRAND_CONSISTENCY,

  CONTENT_STANDARD_CATEGORIES,

  ECW_CAPABILITIES,

  EDITORIAL_TONES,

  ENGINE_HEALTH_STATUSES,

  ENGINE_STATUSES,

  INTEGRATION_TARGETS,

  OPERATIONAL_STATES,

  REVIEW_OUTCOMES,

  VALIDATION_STATUSES,

} from "./paths.js";



export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];

export type EditorialTone = (typeof EDITORIAL_TONES)[number];

export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

export type BrandConsistencyStatus = (typeof BRAND_CONSISTENCY)[number];

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ContentStandardCategory = (typeof CONTENT_STANDARD_CATEGORIES)[number];

export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type EditorInChiefWorkerCapability = (typeof ECW_CAPABILITIES)[number];



export type ContentStandard = {

  standardId: string;

  category: ContentStandardCategory;

  requirement: string;

  enforced: boolean;

};



export type ExecutiveRecommendation = {

  recommendationId: string;

  priority: "high" | "medium" | "low";

  recommendation: string;

  rationale: string;

};



export type PreservedDecision = {

  decisionId: string;

  topic: string;

  decision: string;

  recordedAt: string;

};



/** Machine-readable Editorial Report (Q4-02). */

export type EditorialReport = {

  editorialReportId: string;

  timestamp: string;

  mediaBusinessId: string;

  channelId: string;

  channelIdentity: string;

  editorialStrategy: string;

  targetAudience: string;

  editorialTone: EditorialTone;

  qualityStandards: ContentStandard[];

  contentPriorities: string[];

  reviewOutcome: ReviewOutcome;

  brandConsistencyStatus: BrandConsistencyStatus;

  longTermStrategy: string;

  approvalStatus: ApprovalStatus;

  executiveRecommendations: ExecutiveRecommendation[];

  mediaMissionId: string | null;

  workerId: string;

  reportVersion: string;

  metadataVersion: string;

  traceabilityRefs: string[];

  preservedDecisions: PreservedDecision[];

  submittedToExecutiveReporting: boolean;

  executiveReportId: string | null;

  neverWriteScripts: true;

  neverCreateThumbnails: true;

  neverAssembleVideos: true;

  neverPublishContent: true;

  neverBypassPillowGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementQ403OrLater: true;

  preserveEditorialConsistency: true;

  preserveChannelIdentity: true;

  preserveAudienceAlignment: true;

  preserveAuditHistory: true;

  structuralSignalOnly: true;

  maskSensitiveValues: true;

};



export type EditorInChiefWorkerInput = {

  editorialReportId?: string | null;

  mediaBusinessId?: string | null;

  channelId?: string | null;

  channelName?: string | null;

  mediaMissionId?: string | null;

  editorialStrategy?: string | null;

  channelIdentity?: string | null;

  targetAudience?: string | null;

  editorialTone?: EditorialTone | string | null;

  qualityStandards?: Array<ContentStandard | string> | null;

  contentPriorities?: string[] | null;

  contentReviewNotes?: string | null;

  brandSignals?: string[] | null;

  longTermStrategy?: string | null;

  reviewOutcome?: ReviewOutcome | string | null;

  executiveRecommendations?: Array<ExecutiveRecommendation | string> | null;

  approvalDecision?: ApprovalStatus | string | null;

  pillowGovernanceConfirmed?: boolean;

  validated?: boolean;

  /** Forbidden boundary attempts — always rejected. */

  writeScripts?: boolean;

  createThumbnails?: boolean;

  assembleVideos?: boolean;

  publishContent?: boolean;

  bypassPillowGovernance?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ403OrLater?: boolean;

};



export type IntegrationHandshake = {

  target: IntegrationTarget;

  status: "ready" | "bound" | "unavailable";

  details: string;

  timestamp: string;

};



export type EditorInChiefWorkerValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



export type EditorInChiefWorkerEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: "PILLOW-ECW-001";

  currentOperationalState: OperationalState;

  healthStatus: EngineHealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: EditorInChiefWorkerCapability[];

  totalEditorialReports: number;

  lastEditorialReportId: string | null;

  lastReviewOutcome: ReviewOutcome | null;

  lastApprovalStatus: ApprovalStatus | null;

  lastBrandConsistencyStatus: BrandConsistencyStatus | null;

  workerId: string;

  integrationTargets: IntegrationTarget[];

  metadataVersion: string;

};



export type EditorInChiefWorkerCatalog = {

  reportVersion: string;

  workerId: string;

  editorialReports: EditorialReport[];

  integrations: IntegrationHandshake[];

  metadataVersion: string;

  executiveAuthority: "pillow";

  neverWriteScripts: true;

  neverCreateThumbnails: true;

  neverAssembleVideos: true;

  neverPublishContent: true;

  neverBypassPillowGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

};



export type EditorInChiefWorkerRunReport = {

  editorialRunReportId: string;

  runTimestamp: string;

  action:

    | "connect"

    | "manage_editorial_direction"

    | "define_channel_identity"

    | "define_target_audience"

    | "define_editorial_tone"

    | "define_content_standards"

    | "define_publishing_priorities"

    | "review_content_quality"

    | "ensure_brand_consistency"

    | "maintain_long_term_strategy"

    | "approve_editorial_decisions"

    | "produce_report"

    | "submit_report"

    | "list"

    | "validate"

    | "diagnostics";

  engineRecord: EditorInChiefWorkerEngineRecord;

  catalog: EditorInChiefWorkerCatalog | null;

  editorialReports: EditorialReport[];

  latestEditorialReport: EditorialReport | null;

  integrations: IntegrationHandshake[];

  validation: EditorInChiefWorkerValidationReport;

  durationMs: number;

  metadataVersion: string;

};



export type EditorInChiefWorkerState = {

  engineVersion: "PILLOW-ECW-001";

  missionId: "Q4-02";

  status: EngineStatus;

  initializedAt: string;

  configuration: EditorInChiefWorkerConfiguration;

  latestReport: EditorInChiefWorkerRunReport | null;

  engineRecord: EditorInChiefWorkerEngineRecord | null;

  health: {

    status: EngineHealthStatus;

    healthScore: number;

    engineEnabled: boolean;

    lastOperationAt: string | null;

    lastValidationDecision: "pass" | "partial" | "fail" | null;

    totalEditorialReports: number;

    lastEditorialReportId: string | null;

    lastReviewOutcome: ReviewOutcome | null;

    lastApprovalStatus: ApprovalStatus | null;

    lastBrandConsistencyStatus: BrandConsistencyStatus | null;

    notes: string[];

  };

};



export type EditorInChiefWorkerCockpitSnapshot = {

  missionId: "Q4-02";

  status: EngineStatus;

  healthStatus: EngineHealthStatus;

  totalEditorialReports: number;

  latestEditorialReportId: string | null;

  lastReviewOutcome: ReviewOutcome | null;

  lastApprovalStatus: ApprovalStatus | null;

  lastBrandConsistencyStatus: BrandConsistencyStatus | null;

  workerId: string;

  neverWriteScripts: true;

  neverCreateThumbnails: true;

  neverAssembleVideos: true;

  neverPublishContent: true;

  neverBypassPillowGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

};



export type EditorialContext = {

  editorialReportId?: string | null;

  mediaBusinessId?: string | null;

  channelId?: string | null;

  channelName?: string | null;

  mediaMissionId?: string | null;

  editorialStrategy?: string | null;

  channelIdentity?: string | null;

  targetAudience?: string | null;

  editorialTone?: EditorialTone | null;

  qualityStandards?: ContentStandard[];

  contentPriorities?: string[];

  contentReviewNotes?: string | null;

  brandSignals?: string[];

  longTermStrategy?: string | null;

  reviewOutcome?: ReviewOutcome | null;

  executiveRecommendations?: ExecutiveRecommendation[];

  approvalStatus?: ApprovalStatus | null;

  brandConsistencyStatus?: BrandConsistencyStatus | null;

  preservedDecisions?: PreservedDecision[];

  traceabilityRefs?: string[];

};


