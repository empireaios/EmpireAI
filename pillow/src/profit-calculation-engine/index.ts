/** PILLOW-PC-001 — Profit Calculation Engine exports (R3-06). */

export {
  ProfitCalculationEngine,
  createProfitCalculationEngine,
  resetProfitCalculationEngineForTesting,
} from "./engine.js";

export {
  buildProfitCalculationEngineConfiguration,
  DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION,
  type ProfitCalculationEngineConfiguration,
} from "./configuration.js";

export {
  PROFIT_CALCULATION_ENGINE_SYSTEM_PATH,
  PC_METADATA_VERSION,
  PROFIT_CALCULATION_ENGINE_ID,
  PC_CAPABILITIES,
} from "./paths.js";

export type {
  ProfitCalculationEngineVersion,
  ProfitEngineRecord,
  ProfitRecord,
  ProfitAggregationSummary,
  ProfitCalculationRunReport,
  ProfitCalculationEngineState,
  ProfitCockpitSnapshot,
  ProfitHealthReport,
  ProfitPerformanceStats,
  ConnectProfitCalculationEngineInput,
  CalculateProfitInput,
  CalculateProfitByMarketplaceInput,
  CalculateProfitBySupplierInput,
  AggregateProfitInput,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
