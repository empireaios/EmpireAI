export {
  createSideBySideComparison,
  SideBySideComparisonEngine,
  resetSideBySideComparisonForTesting,
} from "./engine.js";
export {
  buildSideBySideComparisonConfiguration,
  DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION,
} from "./configuration.js";
export {
  SIDE_BY_SIDE_COMPARISON_SYSTEM_PATH,
  COMPARISON_METADATA_VERSION,
  ENGINE_STATUSES,
  COMPARISON_STATUSES,
  COMPARISON_TYPES,
  COMPARISON_DECISIONS,
} from "./paths.js";
export type {
  SideBySideComparisonState,
  SideBySideComparisonRecord,
  ComparisonSession,
  ComparisonRunReport,
  ComparisonRunValidationReport,
  SideBySideComparisonCockpitSnapshot,
  ComparisonHealthReport,
  ComparisonPerformanceStats,
  ComparisonType,
  ComparisonStatus,
  ComparisonDecision,
  ComparisonInput,
  ComparedOption,
  VisualDifferenceMarker,
} from "./types.js";
export type { SideBySideComparisonConfiguration } from "./configuration.js";
