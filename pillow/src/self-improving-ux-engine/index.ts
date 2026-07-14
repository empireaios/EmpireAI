export {
  SelfImprovingUxEngine,
  createSelfImprovingUxEngine,
  resetSelfImprovingUxForTesting,
} from "./engine.js";
export type { SelfImprovingUxOptions } from "./engine.js";

export {
  buildSelfImprovingUxConfiguration,
  DEFAULT_SELF_IMPROVING_UX_CONFIGURATION,
} from "./configuration.js";
export type { SelfImprovingUxConfiguration } from "./configuration.js";

export {
  SELF_IMPROVING_UX_SYSTEM_PATH,
  UX_LEARNING_METADATA_VERSION,
  LEARNING_CATEGORIES,
} from "./paths.js";

export type {
  SelfImprovingUxState,
  SelfImprovingUxCockpitSnapshot,
  SelfImprovingUxRunReport,
  UxLearningRecord,
  KnowledgeBaseEntry,
  SelfImprovingUxInput,
  LearningHealthReport,
  LearningPerformanceStats,
  LearningSessionRecord,
  LearningCategory,
} from "./types.js";
