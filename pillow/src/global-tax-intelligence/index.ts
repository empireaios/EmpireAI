/** PILLOW-GTI-001 — Global Tax Intelligence exports (X4-07). */

export {
  GlobalTaxIntelligenceEngine,
  createGlobalTaxIntelligenceEngine,
  resetGlobalTaxIntelligenceForTesting,
  type GlobalTaxIntelligenceDependencies,
  type GlobalTaxIntelligenceOptions,
} from "./engine.js";

export {
  buildGlobalTaxIntelligenceConfiguration,
  DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION,
  type GlobalTaxIntelligenceConfiguration,
} from "./configuration.js";

export {
  GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH,
  GTI_METADATA_VERSION,
  GLOBAL_TAX_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  GTI_CAPABILITIES,
  TAX_CATEGORIES,
  COMPLIANCE_STATUSES,
  RISK_LEVELS,
} from "./paths.js";

export type {
  GlobalTaxIntelligenceVersion,
  EngineStatus,
  OperationalState,
  GtiCapability,
  ValidationStatus,
  HealthStatus,
  TaxCategory,
  ComplianceStatus,
  RiskLevel,
  TaxIntelligenceRecord,
  GlobalTaxIntelligenceEngineRecord,
  TaxRecommendation,
  TaxValidationReport,
  GtiRunReport,
  GtiHealthReport,
  GtiPerformanceStats,
  GlobalTaxIntelligenceState,
  GtiCockpitSnapshot,
  ConnectGlobalTaxIntelligenceInput,
  TaxAnalysisInput,
  RunGtiDiagnosticsInput,
} from "./types.js";
