/** PILLOW-PI-001 — Procurement Intelligence exports (R2-19). */

export {
  ProcurementIntelligenceEngine,
  createProcurementIntelligenceEngine,
  resetProcurementIntelligenceForTesting,
} from "./engine.js";

export {
  buildProcurementIntelligenceConfiguration,
  DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION,
  type ProcurementIntelligenceConfiguration,
} from "./configuration.js";

export {
  PROCUREMENT_INTELLIGENCE_SYSTEM_PATH,
  PI_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as PI_SUPPORTED_SUPPLIER_IDENTIFIERS,
  PURCHASE_TIMING_RECOMMENDATIONS,
  ANOMALY_TYPES,
} from "./paths.js";

export type {
  ProcurementIntelligenceVersion,
  ProcurementIntelligenceRecord,
  ProcurementIntelligenceReport,
  ProcurementIntelligenceState,
  ProcurementIntelligenceCockpitSnapshot,
  ProcurementIntelligenceHealthReport,
  ProcurementIntelligencePerformanceStats,
  AnalyzeProcurementInput,
  PurchaseTimingRecommendation,
  AnomalyType,
  SupportedSupplierIdentifier as PiSupportedSupplierIdentifier,
} from "./types.js";
