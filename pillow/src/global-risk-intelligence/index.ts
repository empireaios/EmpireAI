/** PILLOW-GRI-001 — Global Risk Intelligence exports (X4-15). */

export {
  GlobalRiskIntelligenceEngine,
  createGlobalRiskIntelligenceEngine,
  resetGlobalRiskIntelligenceForTesting,
  type GlobalRiskIntelligenceDependencies,
  type GlobalRiskIntelligenceOptions,
} from "./engine.js";

export {
  buildGlobalRiskIntelligenceConfiguration,
  DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION,
  type GlobalRiskIntelligenceConfiguration,
} from "./configuration.js";

export {
  GLOBAL_RISK_INTELLIGENCE_SYSTEM_PATH,
  GRI_METADATA_VERSION,
  GLOBAL_RISK_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  GRI_CAPABILITIES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_STATUSES,
  PRIORITY_LEVELS,
} from "./paths.js";

export type {
  GlobalRiskIntelligenceVersion,
  EngineStatus,
  OperationalState,
  RgoCapability,
  ValidationStatus,
  HealthStatus,
  OptimizationCategory,
  OptimizationStatus,
  PriorityLevel,
  RegionalOptimizationRecord,
  GlobalRiskIntelligenceEngineRecord,
  RegionalGrowthRecommendation,
  RegionalValidationReport,
  RgoRunReport,
  RgoHealthReport,
  RgoPerformanceStats,
  GlobalRiskIntelligenceState,
  RgoCockpitSnapshot,
  ConnectGlobalRiskIntelligenceInput,
  RegionalOptimizationInput,
  RunRgoDiagnosticsInput,
} from "./types.js";
