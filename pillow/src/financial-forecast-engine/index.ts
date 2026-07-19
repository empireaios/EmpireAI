/** PILLOW-FCT-001 — Financial Forecast Engine exports (R3-13). */

export {
  FinancialForecastEngine,
  createFinancialForecastEngine,
  resetFinancialForecastEngineForTesting,
} from "./engine.js";

export {
  buildFinancialForecastEngineConfiguration,
  DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION,
  type FinancialForecastEngineConfiguration,
  type ForecastPeriodRule,
} from "./configuration.js";

export {
  FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH,
  FCT_METADATA_VERSION,
  FINANCIAL_FORECAST_ENGINE_ID,
  FCT_CAPABILITIES,
  FORECAST_PERIODS,
} from "./paths.js";

export type {
  FinancialForecastEngineVersion,
  FinancialForecastEngineRecord,
  ForecastRecord,
  FinancialTrend,
  FinancialForecastRunReport,
  FinancialForecastEngineState,
  ForecastCockpitSnapshot,
  ForecastHealthReport,
  ForecastPerformanceStats,
  ConnectFinancialForecastEngineInput,
  GenerateFinancialProjectionInput,
  AnalyzeFinancialTrendsInput,
  DetectForecastDeviationsInput,
  ForecastPeriod,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
