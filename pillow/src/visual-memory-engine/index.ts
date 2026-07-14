export {
  createVisualMemoryEngine,
  VisualMemoryEngine,
  resetVisualMemoryForTesting,
} from "./engine.js";
export {
  buildVisualMemoryConfiguration,
  DEFAULT_VISUAL_MEMORY_CONFIGURATION,
  effectiveMemoryCaptureIntervalMs,
  SENSITIVE_FIELD_PATTERNS,
} from "./configuration.js";
export {
  VISUAL_MEMORY_SYSTEM_PATH,
  MEMORY_RECORD_VERSION,
  MEMORY_STATUSES,
  RETENTION_CATEGORIES,
} from "./paths.js";
export type {
  VisualMemoryState,
  VisualMemoryRecord,
  MemoryComparisonResult,
  MemoryHealthReport,
  MemoryPerformanceStats,
  MemorySessionState,
  VisualMemoryCockpitSnapshot,
  MemoryStatus,
  RetentionCategory,
  MemoryIndexEntry,
} from "./types.js";
export type { VisualMemoryConfiguration } from "./configuration.js";
