/** PILLOW-GEF-001 — Global Expansion Framework exports (X4-01). */

export {
  GlobalExpansionFrameworkEngine,
  createGlobalExpansionFrameworkEngine,
  resetGlobalExpansionFrameworkForTesting,
} from "./engine.js";

export {
  buildGlobalExpansionFrameworkConfiguration,
  DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION,
  type GlobalExpansionFrameworkConfiguration,
} from "./configuration.js";

export {
  GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH,
  GEF_METADATA_VERSION,
  GLOBAL_EXPANSION_FRAMEWORK_ID,
  ENGINE_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  GlobalExpansionFrameworkVersion,
  EngineStatus,
  ModuleState,
  ModuleType,
  FrameworkCapability,
  ExpansionModuleDefinition,
  GlobalExpansionFrameworkRecord,
  NormalizedExpansionEvent,
  ExpansionEventResult,
  AbstractedRegionalData,
  ExpansionValidationReport,
  ExpansionFrameworkRunReport,
  ExpansionFrameworkHealthReport,
  ExpansionFrameworkPerformanceStats,
  GlobalExpansionFrameworkState,
  ExpansionFrameworkCockpitSnapshot,
  RegisterExpansionModuleInput,
  RouteExpansionEventInput,
  AbstractRegionalDataInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";
