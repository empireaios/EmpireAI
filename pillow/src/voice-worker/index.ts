export {
  VoiceWorker,
  createVoiceWorker,
  resetVoiceWorkerForTesting,
  type VoiceWorkerOptions,
} from "./engine.js";
export type { VoiceWorkerDependencies } from "./integrations.js";
export {
  buildVoiceWorkerConfiguration,
  DEFAULT_VOICE_WORKER_CONFIGURATION,
  type VoiceWorkerConfiguration,
} from "./configuration.js";
export {
  VOICE_WORKER_ID,
  VOICE_WORKER_SYSTEM_PATH,
  VOICE_WORKER_IDENTITY,
  VOW_METADATA_VERSION,
  VOW_REPORT_VERSION,
  VOICE_PROFILES,
  VOICE_LANGUAGES,
  VOICE_TONES,
  EMOTIONAL_STYLES,
  QUALITY_STATUSES,
  VOICE_CAPABILITIES_CATALOG,
  VOW_CAPABILITIES,
  INTEGRATION_TARGETS as VOW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  VoiceWorkerState,
  VoiceReport,
  VoiceReport as VowVoiceReport,
  VoiceWorkerInput,
  VoiceWorkerRunReport,
  VoiceWorkerCatalog,
  VoiceWorkerCockpitSnapshot,
  VoiceWorkerEngineRecord,
  VoiceWorkerValidationReport,
  NarrationSegment,
  VoiceGenerationSettings,
  VoiceAssetRef,
  VoiceVariant,
  VoiceConfigHistoryEntry,
  VoiceProfile,
  VoiceLanguage,
  VoiceTone,
  EmotionalStyle,
  QualityStatus as VowQualityStatus,
  IntegrationHandshake as VowIntegrationHandshake,
} from "./types.js";
export { resetVoiceSequenceForTesting } from "./voice-builder.js";
export { appendVowLog, getVowLogs, resetVowLogsForTesting } from "./vow-logging.js";
