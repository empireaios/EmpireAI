/** PILLOW-BNI-001 — Bottleneck Intelligence exports (X3-10). */

export {
  BottleneckIntelligenceEngine,
  createBottleneckIntelligenceEngine,
  resetBottleneckIntelligenceForTesting,
  type BottleneckIntelligenceDependencies,
  type BottleneckIntelligenceOptions,
} from "./engine.js";

export {
  buildBottleneckIntelligenceConfiguration,
  DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION,
  type BottleneckIntelligenceConfiguration,
} from "./configuration.js";

export {
  BOTTLENECK_INTELLIGENCE_SYSTEM_PATH,
  BNI_METADATA_VERSION,
  BOTTLENECK_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  BOTTLENECK_CATEGORIES,
  BNI_CAPABILITIES,
} from "./paths.js";

export type {
  BottleneckIntelligenceVersion,
  EngineStatus,
  OperationalState,
  BottleneckCategory,
  BniCapability,
  ValidationStatus,
  HealthStatus,
  BottleneckRecord,
  BottleneckIntelligenceEngineRecord,
  BottleneckRecommendation,
  BottleneckValidationReport,
  BniRunReport,
  BniHealthReport,
  BniPerformanceStats,
  BottleneckIntelligenceState,
  BniCockpitSnapshot,
  ConnectBottleneckIntelligenceInput,
  BottleneckIntelligenceInput,
  RunBniDiagnosticsInput,
} from "./types.js";
