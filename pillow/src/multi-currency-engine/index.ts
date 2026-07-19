/** PILLOW-MC-001 — Multi-Currency Engine exports (R3-12). */

export {
  MultiCurrencyEngine,
  createMultiCurrencyEngine,
  resetMultiCurrencyEngineForTesting,
} from "./engine.js";

export {
  buildMultiCurrencyEngineConfiguration,
  DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION,
  type MultiCurrencyEngineConfiguration,
} from "./configuration.js";

export {
  MULTI_CURRENCY_ENGINE_SYSTEM_PATH,
  MC_METADATA_VERSION,
  MULTI_CURRENCY_ENGINE_ID,
  MC_CAPABILITIES,
  CONVERSION_STATUSES,
  SUPPORTED_CURRENCY_CODES,
} from "./paths.js";

export type {
  MultiCurrencyEngineVersion,
  MultiCurrencyEngineRecord,
  CurrencyRecord,
  ExchangeRateRecord,
  CurrencyGainLossRecord,
  CurrencySummary,
  MultiCurrencyRunReport,
  MultiCurrencyEngineState,
  CurrencyCockpitSnapshot,
  CurrencyHealthReport,
  CurrencyPerformanceStats,
  ConnectMultiCurrencyEngineInput,
  RecordTransactionCurrencyInput,
  ConvertCurrencyInput,
  RefreshExchangeRatesInput,
  CalculateCurrencyGainLossInput,
  GenerateCurrencySummaryInput,
  ConversionStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
