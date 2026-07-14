export {
  createVisualConsistencyEngine,
  VisualConsistencyEngine,
  resetVisualConsistencyForTesting,
} from "./engine.js";
export {
  buildVisualConsistencyConfiguration,
  DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION,
} from "./configuration.js";
export {
  VISUAL_CONSISTENCY_SYSTEM_PATH,
  CONSISTENCY_METADATA_VERSION,
  CONSISTENCY_CATEGORIES,
} from "./paths.js";
export type {
  VisualConsistencyState,
  ConsistencyReviewRecord,
  ConsistencyReviewReport,
  ConsistencyValidationReport,
  VisualConsistencyCockpitSnapshot,
  ConsistencyFinding,
  ConsistencyStrength,
  ConsistencyCategory,
  FindingSeverity,
} from "./types.js";
export type { VisualConsistencyConfiguration } from "./configuration.js";
