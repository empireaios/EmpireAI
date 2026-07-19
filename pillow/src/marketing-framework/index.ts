/** PILLOW-MFW-001 — Marketing Framework exports (R5-01). */

export {
  MarketingFrameworkEngine,
  createMarketingFrameworkEngine,
  resetMarketingFrameworkForTesting,
} from "./engine.js";

export {
  buildMarketingFrameworkConfiguration,
  DEFAULT_MARKETING_FRAMEWORK_CONFIGURATION,
  type MarketingFrameworkConfiguration,
} from "./configuration.js";

export {
  MARKETING_FRAMEWORK_SYSTEM_PATH,
  MARKETING_METADATA_VERSION,
  ENGINE_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  MarketingFrameworkEngineVersion,
  EngineStatus,
  ModuleState,
  ModuleType,
  AuthenticationMethod,
  FrameworkCapability,
  MarketingModuleDefinition,
  MarketingFrameworkRecord,
  NormalizedMarketingEvent,
  MarketingEventResult,
  AbstractedMarketingData,
  CredentialValidationResult,
  MarketingValidationReport,
  FrameworkRunReport,
  FrameworkHealthReport,
  FrameworkPerformanceStats,
  MarketingFrameworkState,
  FrameworkCockpitSnapshot,
  RegisterMarketingModuleInput,
  RouteMarketingEventInput,
  AbstractMarketingDataInput,
  RunDiagnosticsInput,
  IMarketingModulePlugin,
} from "./types.js";
