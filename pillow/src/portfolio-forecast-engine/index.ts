/** PILLOW-PFE-001 — Portfolio Forecast Engine exports (X2-14). */

export {
  PortfolioForecastEngine,
  createPortfolioForecastEngine,
  resetPortfolioForecastEngineForTesting,
  type PortfolioForecastEngineDependencies,
  type PortfolioForecastEngineOptions,
} from "./engine.js";

export {
  buildPortfolioForecastEngineConfiguration,
  DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION,
  type PortfolioForecastEngineConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH,
  PFE_METADATA_VERSION,
  PORTFOLIO_FORECAST_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PFE_CAPABILITIES,
  FORECAST_PERIODS,
  SCENARIO_TYPES,
} from "./paths.js";

export { appendPfeLog, getPfeLogs, resetPfeLogsForTesting } from "./pfe-logging.js";

export type {
  PortfolioForecastEngineState,
  ForecastRecord,
  ForecastScenario,
  PortfolioForecastEngineRecord,
  ForecastRunReport,
  ForecastCockpitSnapshot,
  ForecastHealthReport,
  ForecastPerformanceStats,
  ConnectPortfolioForecastEngineInput,
  ForecastRequestInput,
  GenerateScenariosInput,
  GenerateExecutiveForecastInput,
  RunForecastDiagnosticsInput,
} from "./types.js";
