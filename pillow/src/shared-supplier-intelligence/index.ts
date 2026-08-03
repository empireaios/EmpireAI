/** PILLOW-SSI-001 — Shared Supplier Intelligence exports (X2-13). */

export {
  SharedSupplierIntelligence,
  createSharedSupplierIntelligence,
  resetSharedSupplierIntelligenceForTesting,
  type SharedSupplierIntelligenceDependencies,
  type SharedSupplierIntelligenceOptions,
} from "./engine.js";

export {
  buildSharedSupplierIntelligenceConfiguration,
  DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION,
  type SharedSupplierIntelligenceConfiguration,
} from "./configuration.js";

export {
  SHARED_SUPPLIER_INTELLIGENCE_SYSTEM_PATH,
  SSI_METADATA_VERSION,
  SHARED_SUPPLIER_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SSI_CAPABILITIES,
} from "./paths.js";

export { appendSsiLog, getSsiLogs, resetSsiLogsForTesting } from "./ssi-logging.js";

export type {
  SharedSupplierIntelligenceState,
  SupplierIntelligenceRecord,
  SupplierIntelligenceEngineRecord,
  SupplierIntelligenceRunReport,
  SupplierRiskSignal,
  SupplierIntelligenceRecommendation,
  SupplierIntelligenceCockpitSnapshot,
  SupplierIntelligenceHealthReport,
  SupplierIntelligencePerformanceStats,
  ConnectSharedSupplierIntelligenceInput,
  ConsolidateSupplierKnowledgeInput,
  TrackSupplierPerformanceInput,
  DetectSupplierRisksInput,
  DetectSupplierDuplicatesInput,
  RecommendSupplierInput,
  ShareSupplierIntelligenceInput,
  RunSupplierIntelligenceDiagnosticsInput,
} from "./types.js";
