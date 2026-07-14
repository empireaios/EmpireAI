export {
  createLayoutUnderstandingEngine,
  LayoutUnderstandingEngine,
  resetLayoutUnderstandingForTesting,
} from "./engine.js";
export {
  buildLayoutUnderstandingConfiguration,
  DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION,
  effectiveAnalysisIntervalMs,
} from "./configuration.js";
export {
  LAYOUT_UNDERSTANDING_SYSTEM_PATH,
  LAYOUT_MODEL_VERSION,
  STRUCTURAL_REGION_TYPES,
} from "./paths.js";
export type {
  LayoutUnderstandingState,
  LayoutModel,
  LayoutMetadata,
  StructuralRegion,
  SpatialRelationship,
  AlignmentRelationship,
  GroupingRelationship,
  LayoutChangeSummary,
  LayoutHealthReport,
  LayoutPerformanceStats,
  LayoutSessionState,
  LayoutUnderstandingCockpitSnapshot,
  LayoutStatus,
  StructuralRegionType,
} from "./types.js";
export type { LayoutUnderstandingConfiguration } from "./configuration.js";
