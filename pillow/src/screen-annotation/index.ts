export {
  createScreenAnnotation,
  ScreenAnnotationEngine,
  resetScreenAnnotationForTesting,
} from "./engine.js";
export {
  buildScreenAnnotationConfiguration,
  DEFAULT_SCREEN_ANNOTATION_CONFIGURATION,
} from "./configuration.js";
export {
  SCREEN_ANNOTATION_SYSTEM_PATH,
  ANNOTATION_METADATA_VERSION,
  ENGINE_STATUSES,
  PROCESSING_STATUSES,
  ANNOTATION_TYPES,
  ANNOTATION_DECISIONS,
} from "./paths.js";
export type {
  ScreenAnnotationState,
  ScreenAnnotationRecord,
  PointAndEditIntent,
  AnnotationSession,
  AnnotationRunReport,
  AnnotationRunValidationReport,
  ScreenAnnotationCockpitSnapshot,
  AnnotationHealthReport,
  AnnotationPerformanceStats,
  AnnotationType,
  ProcessingStatus,
  AnnotationDecision,
  AnnotationInput,
  PointerCoordinates,
  ScreenRegionBounds,
} from "./types.js";
export type { ScreenAnnotationConfiguration } from "./configuration.js";
