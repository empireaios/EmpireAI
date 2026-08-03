import type { VideoAssemblyWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MOTION_EFFECTS,
  OPERATIONAL_STATES,
  OUTPUT_ASPECTS,
  OUTPUT_RESOLUTIONS,
  QUALITY_STATUSES,
  TRANSITION_TYPES,
  VALIDATION_STATUSES,
  VAW_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type OutputAspect = (typeof OUTPUT_ASPECTS)[number];
export type OutputResolution = (typeof OUTPUT_RESOLUTIONS)[number];
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export type MotionEffect = (typeof MOTION_EFFECTS)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type VideoAssemblyWorkerCapability = (typeof VAW_CAPABILITIES)[number];

export type MediaAssetRef = {
  assetId: string;
  assetPath: string;
  assetKind: "script" | "voice" | "visual" | "creative" | "music" | "caption" | "other";
  durationSec?: number;
  descriptor?: string;
};

export type SceneTimelineEntry = {
  sceneId: string;
  order: number;
  startSec: number;
  endSec: number;
  scriptSectionId?: string;
  voiceAssetId?: string;
  visualAssetIds: string[];
  creativeAssetIds: string[];
  musicAssetId?: string | null;
  captionText?: string;
  transition: TransitionType;
  motionEffect: MotionEffect;
};

export type RenderSettings = {
  settingsId: string;
  frameRate: number;
  aspects: OutputAspect[];
  resolutions: OutputResolution[];
  includeCaptions: boolean;
  includeMusic: boolean;
  syncToleranceMs: number;
};

export type OutputFormat = {
  formatId: string;
  aspect: OutputAspect;
  resolution: OutputResolution;
  width: number;
  height: number;
  container: "mp4" | "mov" | "webm" | "structural_ref";
  assetPath: string;
};

export type QualityValidation = {
  status: QualityStatus;
  syncValidated: boolean;
  timelineValidated: boolean;
  renderValidated: boolean;
  notes: string;
  score: number;
};

export type FinalVideoReference = {
  videoId: string;
  primaryPath: string;
  formats: OutputFormat[];
  durationSec: number;
  descriptor: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Video Assembly Report (Q4-11). */
export type VideoAssemblyReport = {
  assemblyId: string;
  timestamp: string;
  scriptId: string;
  voiceAssetId: string;
  visualAssetIds: string[];
  creativeAssetIds: string[];
  musicAssetId: string | null;
  sceneTimeline: SceneTimelineEntry[];
  renderSettings: RenderSettings;
  outputFormats: OutputFormat[];
  qualityValidation: QualityValidation;
  finalVideoReference: FinalVideoReference;
  metadataVersion: string;
  channelId: string;
  topicId: string | null;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverWriteScripts: true;
  neverGenerateVoiceovers: true;
  neverGenerateThumbnails: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ412OrLater: true;
  preserveCompleteAssetTraceability: true;
  preserveSynchronizationBetweenMediaAssets: true;
  validateRenderingQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type VideoAssemblyWorkerInput = {
  assemblyId?: string | null;
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  voiceAssetId?: string | null;
  voiceReportId?: string | null;
  visualAssetIds?: string[] | null;
  creativeAssetIds?: string[] | null;
  musicAssetId?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }> | null;
  narrationReadyText?: string | null;
  voiceAssets?: MediaAssetRef[] | null;
  visualAssets?: MediaAssetRef[] | null;
  creativeAssets?: MediaAssetRef[] | null;
  musicAssets?: MediaAssetRef[] | null;
  includeCaptions?: boolean | null;
  aspects?: OutputAspect[] | null;
  resolutions?: OutputResolution[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  writeScripts?: boolean;
  generateVoiceovers?: boolean;
  generateThumbnails?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ412OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type VideoAssemblyWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type VideoAssemblyWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-VAW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: VideoAssemblyWorkerCapability[];
  totalAssemblyReports: number;
  lastAssemblyId: string | null;
  lastScriptId: string | null;
  lastVoiceAssetId: string | null;
  lastOutputFormatCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type VideoAssemblyWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  assemblyReports: VideoAssemblyReport[];
  integrations: IntegrationHandshake[];
  supportedAspects: OutputAspect[];
  supportedResolutions: OutputResolution[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverWriteScripts: true;
  neverGenerateVoiceovers: true;
  neverGenerateThumbnails: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type VideoAssemblyWorkerRunReport = {
  assemblyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_scripts"
    | "receive_approved_voice_assets"
    | "receive_approved_visual_assets"
    | "receive_approved_creative_assets"
    | "receive_approved_music_assets"
    | "synchronize_narration_and_visuals"
    | "apply_scene_transitions"
    | "apply_motion_effects"
    | "produce_multiple_output_resolutions"
    | "validate_rendering_quality"
    | "produce_video_assembly_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: VideoAssemblyWorkerEngineRecord;
  catalog: VideoAssemblyWorkerCatalog | null;
  assemblyReports: VideoAssemblyReport[];
  latestAssemblyReport: VideoAssemblyReport | null;
  integrations: IntegrationHandshake[];
  validation: VideoAssemblyWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type VideoAssemblyWorkerState = {
  engineVersion: "PILLOW-VAW-001";
  missionId: "Q4-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: VideoAssemblyWorkerConfiguration;
  latestReport: VideoAssemblyWorkerRunReport | null;
  engineRecord: VideoAssemblyWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAssemblyReports: number;
    lastAssemblyId: string | null;
    lastScriptId: string | null;
    lastVoiceAssetId: string | null;
    lastOutputFormatCount: number | null;
    notes: string[];
  };
};

export type VideoAssemblyWorkerCockpitSnapshot = {
  missionId: "Q4-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAssemblyReports: number;
  latestAssemblyId: string | null;
  lastScriptId: string | null;
  lastVoiceAssetId: string | null;
  lastOutputFormatCount: number | null;
  workerId: string;
  neverWriteScripts: true;
  neverGenerateVoiceovers: true;
  neverGenerateThumbnails: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type AssemblyContext = {
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  voiceAssetId?: string | null;
  voiceReportId?: string | null;
  visualAssetIds?: string[];
  creativeAssetIds?: string[];
  musicAssetId?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }>;
  narrationReadyText?: string | null;
  voiceAssets?: MediaAssetRef[];
  visualAssets?: MediaAssetRef[];
  creativeAssets?: MediaAssetRef[];
  musicAssets?: MediaAssetRef[];
  includeCaptions?: boolean;
  aspects?: OutputAspect[];
  resolutions?: OutputResolution[];
  receivedScript?: boolean;
  receivedVoice?: boolean;
  receivedVisuals?: boolean;
  receivedCreatives?: boolean;
  receivedMusic?: boolean;
  sceneTimeline?: SceneTimelineEntry[];
  renderSettings?: RenderSettings | null;
  outputFormats?: OutputFormat[];
  qualityValidation?: QualityValidation | null;
  finalVideoReference?: FinalVideoReference | null;
};
