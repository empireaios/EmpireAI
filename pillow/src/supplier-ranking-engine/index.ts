/** PILLOW-SRE-001 — Supplier Ranking Engine exports (R2-08). */

export {
  SupplierRankingEngine,
  createSupplierRankingEngine,
  resetSupplierRankingEngineForTesting,
} from "./engine.js";

export {
  buildSupplierRankingEngineConfiguration,
  DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION,
  type SupplierRankingEngineConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_RANKING_ENGINE_SYSTEM_PATH,
  SRE_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as SUPPLIER_RANKING_SUPPLIER_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type {
  SupplierRankingEngineVersion,
  SupplierRankingRecord,
  SupplierRankingReport,
  SupplierRankingEngineState,
  SupplierRankingCockpitSnapshot,
  SupplierRankingHealthReport,
  SupplierRankingPerformanceStats,
  RankSuppliersInput,
  EvaluateSupplierInput,
  PerformanceFinding,
  SupplierMetricsSnapshot,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
