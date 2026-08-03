export {
  VideoAssemblyWorker,
  createVideoAssemblyWorker,
  resetVideoAssemblyWorkerForTesting,
  type VideoAssemblyWorkerOptions,
} from "./engine.js";
export type { VideoAssemblyWorkerDependencies } from "./integrations.js";
export {
  buildVideoAssemblyWorkerConfiguration,
  DEFAULT_VIDEO_ASSEMBLY_WORKER_CONFIGURATION,
  type VideoAssemblyWorkerConfiguration,
} from "./configuration.js";
export {
  VIDEO_ASSEMBLY_WORKER_ID,
  VIDEO_ASSEMBLY_WORKER_SYSTEM_PATH,
  VIDEO_ASSEMBLY_WORKER_IDENTITY,
  VAW_METADATA_VERSION,
  VAW_REPORT_VERSION,
  OUTPUT_ASPECTS,
  OUTPUT_RESOLUTIONS,
  TRANSITION_TYPES,
  MOTION_EFFECTS,
  QUALITY_STATUSES,
  VAW_CAPABILITIES,
  INTEGRATION_TARGETS as VAW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  VideoAssemblyWorkerState,
  VideoAssemblyReport,
  VideoAssemblyReport as VawVideoAssemblyReport,
  VideoAssemblyWorkerInput,
  VideoAssemblyWorkerRunReport,
  VideoAssemblyWorkerCatalog,
  VideoAssemblyWorkerCockpitSnapshot,
  VideoAssemblyWorkerEngineRecord,
  VideoAssemblyWorkerValidationReport,
  SceneTimelineEntry,
  RenderSettings,
  OutputFormat,
  QualityValidation,
  FinalVideoReference,
  MediaAssetRef,
  OutputAspect,
  OutputResolution,
  TransitionType,
  MotionEffect,
  QualityStatus as VawQualityStatus,
  IntegrationHandshake as VawIntegrationHandshake,
} from "./types.js";
export { resetAssemblySequenceForTesting } from "./assembly-builder.js";
export { appendVawLog, getVawLogs, resetVawLogsForTesting } from "./vaw-logging.js";
