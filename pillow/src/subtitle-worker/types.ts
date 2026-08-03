import type { SubtitleWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  QUALITY_STATUSES,
  STW_CAPABILITIES,
  SUBTITLE_LANGUAGES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type SubtitleLanguage = (typeof SUBTITLE_LANGUAGES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SubtitleWorkerCapability = (typeof STW_CAPABILITIES)[number];

export type CaptionCue = {
  cueId: string;
  order: number;
  startMs: number;
  endMs: number;
  text: string;
  language: SubtitleLanguage;
};

export type TimingAccuracy = {
  accuracyScore: number;
  averageDriftMs: number;
  maxDriftMs: number;
  withinTolerance: boolean;
  notes: string;
};

export type SyncIssue = {
  issueId: string;
  severity: "info" | "warning" | "error";
  cueId?: string;
  description: string;
};

export type ExportableSubtitleFile = {
  fileId: string;
  format: ExportFormat;
  language: SubtitleLanguage;
  assetPath: string;
  descriptor: string;
  exportable: true;
};

export type QualityValidation = {
  status: QualityStatus;
  timingValidated: boolean;
  syncValidated: boolean;
  transcriptValidated: boolean;
  notes: string;
  score: number;
};

export type TranscriptHistoryEntry = {
  transcriptId: string;
  recordedAt: string;
  language: SubtitleLanguage;
  characterCount: number;
  cueCount: number;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Subtitle Report (Q4-12). */
export type SubtitleReport = {
  subtitleReportId: string;
  timestamp: string;
  videoId: string;
  scriptId: string;
  transcript: string;
  subtitleLanguage: SubtitleLanguage;
  captionTimeline: CaptionCue[];
  timingAccuracy: TimingAccuracy;
  exportFormats: ExportableSubtitleFile[];
  qualityValidation: QualityValidation;
  metadataVersion: string;
  channelId: string;
  voiceAssetId: string | null;
  voiceReportId: string | null;
  assemblyId: string | null;
  languages: SubtitleLanguage[];
  syncIssues: SyncIssue[];
  transcriptHistory: TranscriptHistoryEntry[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ413OrLater: true;
  neverModifyApprovedScripts: true;
  preserveScriptTraceability: true;
  preserveSubtitleSynchronization: true;
  preserveTranscriptHistory: true;
  validateSubtitleQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SubtitleWorkerInput = {
  subtitleReportId?: string | null;
  scriptId?: string | null;
  videoId?: string | null;
  channelId?: string | null;
  voiceAssetId?: string | null;
  voiceReportId?: string | null;
  assemblyId?: string | null;
  subtitleLanguage?: SubtitleLanguage | string | null;
  languages?: SubtitleLanguage[] | null;
  narrationReadyText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }> | null;
  voiceDurationSec?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  rewriteScripts?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ413OrLater?: boolean;
  modifyApprovedScripts?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SubtitleWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SubtitleWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-STW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SubtitleWorkerCapability[];
  totalSubtitleReports: number;
  lastSubtitleReportId: string | null;
  lastScriptId: string | null;
  lastVideoId: string | null;
  lastLanguage: SubtitleLanguage | null;
  lastExportCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SubtitleWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  subtitleReports: SubtitleReport[];
  integrations: IntegrationHandshake[];
  supportedLanguages: SubtitleLanguage[];
  supportedExportFormats: ExportFormat[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SubtitleWorkerRunReport = {
  subtitleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_scripts"
    | "receive_approved_voice_assets"
    | "generate_complete_transcripts"
    | "generate_synchronized_captions"
    | "generate_subtitle_timing"
    | "support_multiple_subtitle_languages"
    | "validate_subtitle_timing_accuracy"
    | "detect_synchronization_issues"
    | "produce_exportable_subtitle_files"
    | "produce_subtitle_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SubtitleWorkerEngineRecord;
  catalog: SubtitleWorkerCatalog | null;
  subtitleReports: SubtitleReport[];
  latestSubtitleReport: SubtitleReport | null;
  integrations: IntegrationHandshake[];
  validation: SubtitleWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SubtitleWorkerState = {
  engineVersion: "PILLOW-STW-001";
  missionId: "Q4-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: SubtitleWorkerConfiguration;
  latestReport: SubtitleWorkerRunReport | null;
  engineRecord: SubtitleWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalSubtitleReports: number;
    lastSubtitleReportId: string | null;
    lastScriptId: string | null;
    lastVideoId: string | null;
    lastLanguage: SubtitleLanguage | null;
    lastExportCount: number | null;
    notes: string[];
  };
};

export type SubtitleWorkerCockpitSnapshot = {
  missionId: "Q4-12";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalSubtitleReports: number;
  latestSubtitleReportId: string | null;
  lastScriptId: string | null;
  lastVideoId: string | null;
  lastLanguage: SubtitleLanguage | null;
  lastExportCount: number | null;
  workerId: string;
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SubtitleContext = {
  scriptId?: string | null;
  videoId?: string | null;
  channelId?: string | null;
  voiceAssetId?: string | null;
  voiceReportId?: string | null;
  assemblyId?: string | null;
  subtitleLanguage?: SubtitleLanguage | null;
  languages?: SubtitleLanguage[];
  narrationReadyText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }>;
  voiceDurationSec?: number | null;
  receivedScript?: boolean;
  receivedVoice?: boolean;
  transcript?: string | null;
  captionTimeline?: CaptionCue[];
  timingAccuracy?: TimingAccuracy | null;
  syncIssues?: SyncIssue[];
  exportFormats?: ExportableSubtitleFile[];
  transcriptHistory?: TranscriptHistoryEntry[];
};
