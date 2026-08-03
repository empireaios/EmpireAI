/** PILLOW-EVE-001 — Enterprise Value Engine exports (X2-19). */

export {
  EnterpriseValueEngine,
  createEnterpriseValueEngine,
  resetEnterpriseValueEngineForTesting,
  type EnterpriseValueEngineDependencies,
  type EnterpriseValueEngineOptions,
} from "./engine.js";

export {
  buildEnterpriseValueEngineConfiguration,
  DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION,
  type EnterpriseValueEngineConfiguration,
} from "./configuration.js";

export {
  SYSTEM_PATH,
  ENTERPRISE_VALUE_ENGINE_SYSTEM_PATH,
  EVE_METADATA_VERSION,
  ENTERPRISE_VALUE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  EVE_CAPABILITIES,
  VALUATION_METHODOLOGIES,
  ANOMALY_SEVERITIES,
} from "./paths.js";

export { appendEveLog, getEveLogs, resetEveLogsForTesting } from "./eve-logging.js";

export type {
  EnterpriseValueEngineState,
  ValuationRecord,
  ValuationRecommendation,
  EnterpriseValueEngineRecord,
  ValuationRunReport,
  ValuationCockpitSnapshot,
  ValuationHealthReport,
  ValuationPerformanceStats,
  ValuationHistoryEntry,
  ValuationAnomaly,
  ConnectEnterpriseValueEngineInput,
  CalculateEnterpriseValueInput,
  CalculateCompanyValuationInput,
  CalculatePortfolioValuationInput,
  EstimateIntrinsicValueInput,
  EstimateMarketValueInput,
  MeasureValueGrowthInput,
  TrackValuationHistoryInput,
  DetectValuationAnomaliesInput,
  GenerateValuationRecommendationsInput,
  RunValuationDiagnosticsInput,
} from "./types.js";
