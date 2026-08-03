/** PILLOW-WPD-001 — Winning Product Detector exports (X3-02). */

export {
  WinningProductDetectorEngine,
  createWinningProductDetectorEngine,
  resetWinningProductDetectorForTesting,
  type WinningProductDetectorDependencies,
  type WinningProductDetectorEngineOptions,
} from "./engine.js";

export {
  buildWinningProductDetectorConfiguration,
  DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION,
  type WinningProductDetectorConfiguration,
} from "./configuration.js";

export {
  WINNING_PRODUCT_DETECTOR_SYSTEM_PATH,
  WPD_METADATA_VERSION,
  WINNING_PRODUCT_DETECTOR_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  WPD_CAPABILITIES,
  OPPORTUNITY_CLASSES,
} from "./paths.js";

export type {
  WinningProductDetectorVersion,
  EngineStatus,
  OperationalState,
  WpdCapability,
  ValidationStatus,
  HealthStatus,
  OpportunityClass,
  ProductOpportunityRecord,
  WinningProductDetectorEngineRecord,
  ProductRecommendation,
  ProductValidationReport,
  WpdRunReport,
  WpdHealthReport,
  WpdPerformanceStats,
  WinningProductDetectorState,
  WpdCockpitSnapshot,
  ConnectWinningProductDetectorInput,
  ProductAnalysisInput,
  RunWpdDiagnosticsInput,
} from "./types.js";
