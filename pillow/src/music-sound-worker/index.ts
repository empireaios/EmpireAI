export {
  MusicSoundWorker,
  createMusicSoundWorker,
  resetMusicSoundWorkerForTesting,
  type MusicSoundWorkerOptions,
} from "./engine.js";
export type { MusicSoundWorkerDependencies } from "./integrations.js";
export {
  buildMusicSoundWorkerConfiguration,
  DEFAULT_MUSIC_SOUND_WORKER_CONFIGURATION,
  type MusicSoundWorkerConfiguration,
} from "./configuration.js";
export {
  MUSIC_SOUND_WORKER_ID,
  MUSIC_SOUND_WORKER_SYSTEM_PATH,
  MUSIC_SOUND_WORKER_IDENTITY,
  MSW_METADATA_VERSION,
  MSW_REPORT_VERSION,
  AUDIO_ASSET_TYPES,
  MUSIC_MOODS,
  LICENSING_STATUSES,
  QUALITY_STATUSES,
  MSW_CAPABILITIES,
  INTEGRATION_TARGETS as MSW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  MusicSoundWorkerState,
  MusicSoundReport,
  MusicSoundReport as MswMusicSoundReport,
  MusicSoundWorkerInput,
  MusicSoundWorkerRunReport,
  MusicSoundWorkerCatalog,
  MusicSoundWorkerCockpitSnapshot,
  MusicSoundWorkerEngineRecord,
  MusicSoundWorkerValidationReport,
  AudioAssetRef,
  SceneAudioSlot,
  AudioPlacement,
  QualityValidation as MswQualityValidation,
  AudioAssetType,
  MusicMood,
  LicensingStatus,
  QualityStatus as MswQualityStatus,
  IntegrationHandshake as MswIntegrationHandshake,
} from "./types.js";
export { resetAudioSequenceForTesting } from "./audio-builder.js";
export { appendMswLog, getMswLogs, resetMswLogsForTesting } from "./msw-logging.js";
