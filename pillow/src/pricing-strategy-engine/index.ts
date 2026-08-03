/** PILLOW-PSE-001 — Pricing Strategy Engine exports (X1-09). */

export {
  PricingStrategyEngine,
  createPricingStrategyEngine,
  resetPricingStrategyEngineForTesting,
  type PricingStrategyEngineDependencies,
  type PricingStrategyEngineOptions,
} from "./engine.js";

export {
  buildPricingStrategyEngineConfiguration,
  DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION,
  type PricingStrategyEngineConfiguration,
} from "./configuration.js";

export {
  PRICING_STRATEGY_ENGINE_SYSTEM_PATH,
  PSE_METADATA_VERSION,
  PRICING_STRATEGY_ENGINE_ID,
  PSE_CAPABILITIES,
} from "./paths.js";

export { appendPseLog, getPseLogs, resetPseLogsForTesting } from "./pse-logging.js";

export type {
  PricingStrategyEngineState,
  PricingRecord,
  PricingRunReport,
  PricingEngineRecord,
  PricingCockpitSnapshot,
  PricingHealthReport,
  PricingPerformanceStats,
  ConnectPricingStrategyEngineInput,
  GeneratePricingStrategyInput,
  PricingActionInput,
  PricingModel,
} from "./types.js";
