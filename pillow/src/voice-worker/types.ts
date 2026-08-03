import type { VoiceWorkerConfiguration } from "./configuration.js";
import type {
  EMOTIONAL_STYLES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  QUALITY_STATUSES,
  VALIDATION_STATUSES,
  VOICE_CAPABILITIES_CATALOG,
  VOICE_LANGUAGES,
  VOICE_PROFILES,
  VOICE_TONES,
  VOW_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type VoiceProfile = (typeof VOICE_PROFILES)[number];
export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number];
export type VoiceTone = (typeof VOICE_TONES)[number];
export type EmotionalStyle = (typeof EMOTIONAL_STYLES)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type VoiceCapability = (typeof VOICE_CAPABILITIES_CATALOG)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type VoiceWorkerCapability = (typeof VOW_CAPABILITIES)[number];

export type NarrationSegment = {
  segmentId: string;
  scriptSectionId?: string;
  order: number;
  text: string;
  estimatedDurationSec: number;
  pauseAfterMs: number;
  pronunciationHints: string[];
};

export type VoiceGenerationSettings = {
  settingsId: string;
  voiceProfile: VoiceProfile;
  language: VoiceLanguage;
  speakingSpeed: number;
  tone: VoiceTone;
  emotionalStyle: EmotionalStyle;
  pauseControlMs: number;
  pronunciationControls: string[];
  exportFormat: "wav" | "mp3" | "flac" | "structural_ref";
};

export type VoiceAssetRef = {
  assetId: string;
  assetPath: string;
  segmentId?: string;
  voiceProfile: VoiceProfile;
  language: VoiceLanguage;
  durationSec: number;
  descriptor: string;
  exportable: true;
};

export type VoiceVariant = {
  variantId: string;
  variantLabel: string;
  voiceProfile: VoiceProfile;
  language: VoiceLanguage;
  assetId: string;
  assetPath: string;
  descriptor: string;
};

export type VoiceConfigHistoryEntry = {
  settingsId: string;
  recordedAt: string;
  voiceProfile: VoiceProfile;
  language: VoiceLanguage;
  speakingSpeed: number;
  tone: VoiceTone;
  emotionalStyle: EmotionalStyle;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Voice Report (Q4-10). */
export type VoiceReport = {
  voiceReportId: string;
  timestamp: string;
  scriptId: string;
  voiceProfile: VoiceProfile;
  language: VoiceLanguage;
  narrationSegments: NarrationSegment[];
  voiceGenerationSettings: VoiceGenerationSettings;
  voiceAssetReferences: VoiceAssetRef[];
  qualityStatus: QualityStatus;
  variantCount: number;
  confidenceScore: number;
  metadataVersion: string;
  channelId: string;
  topicId: string | null;
  variants: VoiceVariant[];
  configurationHistory: VoiceConfigHistoryEntry[];
  qualityNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ411OrLater: true;
  preserveScriptTraceability: true;
  preserveGeneratedVoiceAssetReferences: true;
  preserveVoiceConfigurationHistory: true;
  validateOutputQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type VoiceWorkerInput = {
  voiceReportId?: string | null;
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  voiceProfile?: VoiceProfile | string | null;
  language?: VoiceLanguage | string | null;
  speakingSpeed?: number | null;
  tone?: VoiceTone | string | null;
  emotionalStyle?: EmotionalStyle | string | null;
  pauseControlMs?: number | null;
  pronunciationControls?: string[] | null;
  narrationText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }> | null;
  narrationReadyText?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  rewriteScripts?: boolean;
  assembleVideos?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ411OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type VoiceWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type VoiceWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-VOW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: VoiceWorkerCapability[];
  totalVoiceReports: number;
  lastVoiceReportId: string | null;
  lastScriptId: string | null;
  lastVoiceProfile: VoiceProfile | null;
  lastLanguage: VoiceLanguage | null;
  lastVariantCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type VoiceWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  voiceReports: VoiceReport[];
  integrations: IntegrationHandshake[];
  supportedVoiceProfiles: VoiceProfile[];
  supportedLanguages: VoiceLanguage[];
  voiceCapabilities: VoiceCapability[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type VoiceWorkerRunReport = {
  voiceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_scripts"
    | "prepare_narration_segments"
    | "configure_voice_generation_settings"
    | "support_multiple_voice_profiles"
    | "support_multiple_languages"
    | "control_pacing_and_pronunciation"
    | "generate_voiceover_assets"
    | "validate_voice_quality"
    | "generate_alternate_voice_versions"
    | "produce_voice_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: VoiceWorkerEngineRecord;
  catalog: VoiceWorkerCatalog | null;
  voiceReports: VoiceReport[];
  latestVoiceReport: VoiceReport | null;
  integrations: IntegrationHandshake[];
  validation: VoiceWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type VoiceWorkerState = {
  engineVersion: "PILLOW-VOW-001";
  missionId: "Q4-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: VoiceWorkerConfiguration;
  latestReport: VoiceWorkerRunReport | null;
  engineRecord: VoiceWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalVoiceReports: number;
    lastVoiceReportId: string | null;
    lastScriptId: string | null;
    lastVoiceProfile: VoiceProfile | null;
    lastLanguage: VoiceLanguage | null;
    lastVariantCount: number | null;
    notes: string[];
  };
};

export type VoiceWorkerCockpitSnapshot = {
  missionId: "Q4-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalVoiceReports: number;
  latestVoiceReportId: string | null;
  lastScriptId: string | null;
  lastVoiceProfile: VoiceProfile | null;
  lastLanguage: VoiceLanguage | null;
  lastVariantCount: number | null;
  workerId: string;
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type VoiceContext = {
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  voiceProfile?: VoiceProfile | null;
  language?: VoiceLanguage | null;
  speakingSpeed?: number | null;
  tone?: VoiceTone | null;
  emotionalStyle?: EmotionalStyle | null;
  pauseControlMs?: number | null;
  pronunciationControls?: string[];
  narrationText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }>;
  narrationReadyText?: string | null;
  receivedApprovedScript?: boolean;
  narrationSegments?: NarrationSegment[];
  voiceGenerationSettings?: VoiceGenerationSettings | null;
  configurationHistory?: VoiceConfigHistoryEntry[];
  voiceAssetReferences?: VoiceAssetRef[];
};
