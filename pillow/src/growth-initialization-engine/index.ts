/** PILLOW-GIE-001 — Growth Initialization Engine exports (X1-12). */

export {
  GrowthInitializationEngine,
  createGrowthInitializationEngine,
  resetGrowthInitializationEngineForTesting,
  type GrowthInitializationEngineDependencies,
  type GrowthInitializationEngineOptions,
} from "./engine.js";

export {
  buildGrowthInitializationEngineConfiguration,
  DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION,
  type GrowthInitializationEngineConfiguration,
} from "./configuration.js";

export {
  GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH,
  GIE_METADATA_VERSION,
  GROWTH_INITIALIZATION_ENGINE_ID,
  GIE_CAPABILITIES,
} from "./paths.js";

export { appendGieLog, getGieLogs, resetGieLogsForTesting } from "./gie-logging.js";

export type {
  GrowthInitializationEngineState,
  GrowthPlanRecord,
  GrowthRunReport,
  GrowthEngineRecord,
  GrowthCockpitSnapshot,
  GrowthHealthReport,
  GrowthPerformanceStats,
  ConnectGrowthInitializationEngineInput,
  InitializeGrowthPlanInput,
  GrowthActionInput,
} from "./types.js";
