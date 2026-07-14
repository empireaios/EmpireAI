export {
  ContinuousUxEvolutionEngine,
  createContinuousUxEvolutionEngine,
  resetContinuousUxEvolutionForTesting,
} from "./engine.js";
export type { ContinuousUxEvolutionOptions } from "./engine.js";

export {
  buildContinuousUxEvolutionConfiguration,
  DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION,
} from "./configuration.js";
export type { ContinuousUxEvolutionConfiguration } from "./configuration.js";

export {
  CONTINUOUS_UX_EVOLUTION_SYSTEM_PATH,
  UX_EVOLUTION_METADATA_VERSION,
  EVOLUTION_CATEGORIES,
} from "./paths.js";

export type {
  ContinuousUxEvolutionState,
  ContinuousUxEvolutionCockpitSnapshot,
  ContinuousUxEvolutionRunReport,
  UxEvolutionRecord,
  EvolutionHistoryEntry,
  ContinuousUxEvolutionInput,
  EvolutionHealthReport,
  EvolutionPerformanceStats,
  EvolutionSessionRecord,
  EvolutionCategory,
  ImprovementPriority,
} from "./types.js";
