import type { MusicSoundWorkerConfiguration } from "./configuration.js";
import type {
  AUDIO_ASSET_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LICENSING_STATUSES,
  MSW_CAPABILITIES,
  MUSIC_MOODS,
  OPERATIONAL_STATES,
  QUALITY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AudioAssetType = (typeof AUDIO_ASSET_TYPES)[number];
export type MusicMood = (typeof MUSIC_MOODS)[number];
export type LicensingStatus = (typeof LICENSING_STATUSES)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MusicSoundWorkerCapability = (typeof MSW_CAPABILITIES)[number];

export type AudioAssetRef = {
  assetId: string;
  assetPath: string;
  assetType: AudioAssetType;
  title: string;
  source: "licensed_library" | "generated" | "platform_approved";
  licensingStatus: LicensingStatus;
  licenseId?: string;
  durationSec: number;
  mood?: MusicMood;
  descriptor: string;
};

export type SceneAudioSlot = {
  sceneId: string;
  order: number;
  startSec: number;
  endSec: number;
  mood: MusicMood;
  musicAssetId: string | null;
  soundEffectAssetIds: string[];
  placementNotes: string;
};

export type AudioPlacement = {
  placementId: string;
  assetId: string;
  sceneId: string;
  startSec: number;
  endSec: number;
  role: "music" | "sfx";
  duckingDb: number;
};

export type QualityValidation = {
  status: QualityStatus;
  licensingValidated: boolean;
  timelineValidated: boolean;
  copyrightValidated: boolean;
  notes: string;
  score: number;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Music & Sound Report (Q4-13). */
export type MusicSoundReport = {
  audioReportId: string;
  timestamp: string;
  videoId: string;
  scriptId: string;
  backgroundMusicAssets: AudioAssetRef[];
  soundEffectAssets: AudioAssetRef[];
  sceneTimeline: SceneAudioSlot[];
  audioPlacement: AudioPlacement[];
  licensingStatus: LicensingStatus;
  qualityValidation: QualityValidation;
  metadataVersion: string;
  channelId: string;
  assemblyId: string | null;
  requiredMood: MusicMood;
  requiredSoundEffects: string[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ414OrLater: true;
  neverUseUnapprovedCopyrightedAssets: true;
  preserveCompleteAssetTraceability: true;
  preserveLicensingInformation: true;
  preserveTimelineSynchronization: true;
  validateCopyrightCompliance: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type MusicSoundWorkerInput = {
  audioReportId?: string | null;
  scriptId?: string | null;
  videoId?: string | null;
  channelId?: string | null;
  assemblyId?: string | null;
  requiredMood?: MusicMood | string | null;
  requiredSoundEffects?: string[] | null;
  allowGeneratedMusic?: boolean | null;
  narrationReadyText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }> | null;
  sceneTimeline?: Array<{
    sceneId?: string;
    order?: number;
    startSec?: number;
    endSec?: number;
    scriptSectionId?: string;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  assembleVideos?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ414OrLater?: boolean;
  useUnapprovedCopyrightedAssets?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MusicSoundWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MusicSoundWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MSW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MusicSoundWorkerCapability[];
  totalAudioReports: number;
  lastAudioReportId: string | null;
  lastScriptId: string | null;
  lastVideoId: string | null;
  lastLicensingStatus: LicensingStatus | null;
  lastMusicAssetCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MusicSoundWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  audioReports: MusicSoundReport[];
  integrations: IntegrationHandshake[];
  supportedAudioTypes: AudioAssetType[];
  supportedMoods: MusicMood[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverUseUnapprovedCopyrightedAssets: true;
};

export type MusicSoundWorkerRunReport = {
  audioRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_scripts"
    | "receive_approved_video_timeline"
    | "determine_required_music_mood"
    | "determine_required_sound_effects"
    | "select_licensed_music"
    | "select_generated_music_where_approved"
    | "match_music_to_scenes"
    | "match_sound_effects_to_events"
    | "validate_licensing_compliance"
    | "produce_music_sound_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MusicSoundWorkerEngineRecord;
  catalog: MusicSoundWorkerCatalog | null;
  audioReports: MusicSoundReport[];
  latestAudioReport: MusicSoundReport | null;
  integrations: IntegrationHandshake[];
  validation: MusicSoundWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MusicSoundWorkerState = {
  engineVersion: "PILLOW-MSW-001";
  missionId: "Q4-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: MusicSoundWorkerConfiguration;
  latestReport: MusicSoundWorkerRunReport | null;
  engineRecord: MusicSoundWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAudioReports: number;
    lastAudioReportId: string | null;
    lastScriptId: string | null;
    lastVideoId: string | null;
    lastLicensingStatus: LicensingStatus | null;
    lastMusicAssetCount: number | null;
    notes: string[];
  };
};

export type MusicSoundWorkerCockpitSnapshot = {
  missionId: "Q4-13";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAudioReports: number;
  latestAudioReportId: string | null;
  lastScriptId: string | null;
  lastVideoId: string | null;
  lastLicensingStatus: LicensingStatus | null;
  lastMusicAssetCount: number | null;
  workerId: string;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverUseUnapprovedCopyrightedAssets: true;
};

export type AudioContext = {
  scriptId?: string | null;
  videoId?: string | null;
  channelId?: string | null;
  assemblyId?: string | null;
  requiredMood?: MusicMood | null;
  requiredSoundEffects?: string[];
  allowGeneratedMusic?: boolean;
  narrationReadyText?: string | null;
  scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }>;
  sceneTimelineInput?: Array<{
    sceneId?: string;
    order?: number;
    startSec?: number;
    endSec?: number;
    scriptSectionId?: string;
  }>;
  receivedScript?: boolean;
  receivedTimeline?: boolean;
  backgroundMusicAssets?: AudioAssetRef[];
  soundEffectAssets?: AudioAssetRef[];
  sceneTimeline?: SceneAudioSlot[];
  audioPlacement?: AudioPlacement[];
  licensingStatus?: LicensingStatus | null;
};
