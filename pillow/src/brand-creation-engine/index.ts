/** PILLOW-BCE-001 — Brand Creation Engine exports (X1-05). */

export {
  BrandCreationEngine,
  createBrandCreationEngine,
  resetBrandCreationEngineForTesting,
  type BrandCreationEngineDependencies,
  type BrandCreationEngineOptions,
} from "./engine.js";

export {
  buildBrandCreationEngineConfiguration,
  DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION,
  type BrandCreationEngineConfiguration,
} from "./configuration.js";

export {
  BRAND_CREATION_ENGINE_SYSTEM_PATH,
  BCE_METADATA_VERSION,
  BRAND_CREATION_ENGINE_ID,
  BCE_CAPABILITIES,
} from "./paths.js";

export { appendBceLog, getBceLogs, resetBceLogsForTesting } from "./bce-logging.js";

export type {
  BrandCreationEngineState,
  BrandRecord,
  BrandRunReport,
  BrandEngineRecord,
  BrandCockpitSnapshot,
  BrandHealthReport,
  BrandPerformanceStats,
  ConnectBrandCreationEngineInput,
  CreateBrandInput,
  BrandActionInput,
} from "./types.js";
