/** PILLOW-TX-001 — Tax Intelligence Engine exports (R3-11). */

export {
  TaxIntelligenceEngine,
  createTaxIntelligenceEngine,
  resetTaxIntelligenceEngineForTesting,
} from "./engine.js";

export {
  buildTaxIntelligenceEngineConfiguration,
  DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION,
  type TaxIntelligenceEngineConfiguration,
  type JurisdictionRateRule,
} from "./configuration.js";

export {
  TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  TX_METADATA_VERSION,
  TAX_INTELLIGENCE_ENGINE_ID,
  TX_CAPABILITIES,
  TAX_STATUSES,
  TAX_CATEGORIES,
} from "./paths.js";

export type {
  TaxIntelligenceEngineVersion,
  TaxIntelligenceEngineRecord,
  TaxRecord,
  TaxSummary,
  TaxIntelligenceRunReport,
  TaxIntelligenceEngineState,
  TaxCockpitSnapshot,
  TaxHealthReport,
  TaxPerformanceStats,
  ConnectTaxIntelligenceEngineInput,
  ClassifyTaxableTransactionInput,
  CalculateTaxLiabilityInput,
  CalculateTaxAdjustmentInput,
  RecordTaxPaymentInput,
  GenerateTaxSummaryInput,
  TaxStatus,
  TaxCategory,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
