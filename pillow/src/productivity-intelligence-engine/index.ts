export {
  ProductivityIntelligenceEngine,
  createProductivityIntelligenceEngine,
  resetProductivityIntelligenceForTesting,
} from "./engine.js";
export type { ProductivityIntelligenceOptions } from "./engine.js";

export {
  buildProductivityIntelligenceConfiguration,
  DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION,
} from "./configuration.js";
export type { ProductivityIntelligenceConfiguration } from "./configuration.js";

export {
  PRODUCTIVITY_INTELLIGENCE_SYSTEM_PATH,
  PRODUCTIVITY_METADATA_VERSION,
  PRODUCTIVITY_CATEGORIES,
} from "./paths.js";

export type {
  ProductivityIntelligenceState,
  ProductivityIntelligenceCockpitSnapshot,
  ProductivityLearningRunReport,
  ProductivityIntelligenceRecord,
  LearningSessionRecord,
  ProductivityIntelligenceInput,
  ProductivityHealthReport,
  ProductivityPerformanceStats,
  ProductivityCategory,
} from "./types.js";
