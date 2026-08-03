/** PILLOW-SGE-001 — Store Generation Engine exports (X1-07). */

export {
  StoreGenerationEngine,
  createStoreGenerationEngine,
  resetStoreGenerationEngineForTesting,
  type StoreGenerationEngineDependencies,
  type StoreGenerationEngineOptions,
} from "./engine.js";

export {
  buildStoreGenerationEngineConfiguration,
  DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION,
  type StoreGenerationEngineConfiguration,
} from "./configuration.js";

export {
  STORE_GENERATION_ENGINE_SYSTEM_PATH,
  SGE_METADATA_VERSION,
  STORE_GENERATION_ENGINE_ID,
  SGE_CAPABILITIES,
} from "./paths.js";

export { appendSgeLog, getSgeLogs, resetSgeLogsForTesting } from "./sge-logging.js";

export type {
  StoreGenerationEngineState,
  StorefrontRecord,
  StorefrontRunReport,
  StorefrontEngineRecord,
  StorefrontCockpitSnapshot,
  StorefrontHealthReport,
  StorefrontPerformanceStats,
  ConnectStoreGenerationEngineInput,
  GenerateStorefrontInput,
  StorefrontActionInput,
} from "./types.js";
