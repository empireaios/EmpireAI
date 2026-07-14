export {
  createComponentRecognitionEngine,
  ComponentRecognitionEngine,
  resetComponentRecognitionForTesting,
} from "./engine.js";
export {
  buildComponentRecognitionConfiguration,
  DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION,
  effectiveRecognitionIntervalMs,
} from "./configuration.js";
export {
  COMPONENT_RECOGNITION_SYSTEM_PATH,
  COMPONENT_MODEL_VERSION,
  COMPONENT_TYPES,
} from "./paths.js";
export type {
  ComponentRecognitionState,
  ComponentRecognitionResult,
  ComponentRecognitionMetadata,
  UiComponent,
  ComponentType,
  ComponentChangeSummary,
  ComponentChange,
  RecognitionHealthReport,
  RecognitionPerformanceStats,
  RecognitionSessionState,
  ComponentRecognitionCockpitSnapshot,
  RecognitionStatus,
} from "./types.js";
export type { ComponentRecognitionConfiguration } from "./configuration.js";
