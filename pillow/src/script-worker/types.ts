import type { ScriptWorkerConfiguration } from "./configuration.js";
import type {
  CONTENT_FORMATS,
  EDITORIAL_COMPLIANCE_LEVELS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  SCW_CAPABILITIES,
  SECTION_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type SectionType = (typeof SECTION_TYPES)[number];
export type EditorialComplianceLevel = (typeof EDITORIAL_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ScriptWorkerCapability = (typeof SCW_CAPABILITIES)[number];

export type ScriptSection = {
  sectionId: string;
  sectionType: SectionType;
  heading: string;
  narration: string;
  estimatedSeconds: number;
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

/** Machine-readable Script Report (Q4-05). */
export type ScriptReport = {
  scriptId: string;
  timestamp: string;
  channelId: string;
  topicId: string;
  contentFormat: ContentFormat;
  targetAudience: string;
  scriptTitle: string;
  scriptSections: ScriptSection[];
  estimatedDuration: number;
  editorialCompliance: EditorialComplianceLevel;
  editorialComplianceNotes: string;
  selfReviewSummary: string;
  confidenceScore: number;
  metadataVersion: string;
  topicPlanId: string;
  mediaBusinessId: string;
  editorialReportId: string | null;
  writingStyleNotes: string;
  narrationReadyText: string;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  pillowGovernanceConfirmed: boolean;
  neverGenerateVisuals: true;
  neverGenerateVoiceovers: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ406OrLater: true;
  followApprovedTopicPlan: true;
  followEditorInChiefStrategy: true;
  produceOriginalContent: true;
  preserveScriptTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ScriptWorkerInput = {
  scriptId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  topicPlanId?: string | null;
  topicId?: string | null;
  topicTitle?: string | null;
  contentFormat?: ContentFormat | string | null;
  targetAudience?: string | null;
  editorialStrategy?: string | null;
  channelIdentity?: string | null;
  editorialTone?: string | null;
  contentPriorities?: string[] | null;
  editorialReportId?: string | null;
  pillowGovernanceConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  generateVisuals?: boolean;
  generateVoiceovers?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ406OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ScriptWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ScriptWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SCW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ScriptWorkerCapability[];
  totalScripts: number;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ScriptWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  scripts: ScriptReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverGenerateVisuals: true;
  neverGenerateVoiceovers: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ScriptWorkerRunReport = {
  scriptRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_topic_plan"
    | "receive_editorial_strategy"
    | "determine_content_format"
    | "generate_complete_script"
    | "adapt_writing_style"
    | "structure_script_sections"
    | "generate_narration_ready_output"
    | "self_review_script"
    | "produce_script_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ScriptWorkerEngineRecord;
  catalog: ScriptWorkerCatalog | null;
  scripts: ScriptReport[];
  latestScript: ScriptReport | null;
  integrations: IntegrationHandshake[];
  validation: ScriptWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ScriptWorkerState = {
  engineVersion: "PILLOW-SCW-001";
  missionId: "Q4-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: ScriptWorkerConfiguration;
  latestReport: ScriptWorkerRunReport | null;
  engineRecord: ScriptWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalScripts: number;
    lastScriptId: string | null;
    lastContentFormat: ContentFormat | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ScriptWorkerCockpitSnapshot = {
  missionId: "Q4-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalScripts: number;
  latestScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverGenerateVisuals: true;
  neverGenerateVoiceovers: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ScriptContext = {
  topicPlanId?: string | null;
  topicId?: string | null;
  topicTitle?: string | null;
  editorialStrategy?: string | null;
  editorialReportId?: string | null;
  channelIdentity?: string | null;
  targetAudience?: string | null;
  editorialTone?: string | null;
  contentPriorities?: string[];
  contentFormat?: ContentFormat | null;
  receivedTopicPlan?: boolean;
  receivedEditorial?: boolean;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  findings: SelfReviewFinding[];
  complianceScore: number;
  editorialCompliance: EditorialComplianceLevel;
  editorialComplianceNotes: string;
};
