/** PILLOW-FF-001 — Financial Framework exports (R3-01). */

export {
  FinancialFrameworkEngine,
  createFinancialFrameworkEngine,
  resetFinancialFrameworkForTesting,
} from "./engine.js";

export {
  buildFinancialFrameworkConfiguration,
  DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION,
  type FinancialFrameworkConfiguration,
} from "./configuration.js";

export {
  FINANCIAL_FRAMEWORK_SYSTEM_PATH,
  FINANCIAL_METADATA_VERSION,
  ENGINE_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  FinancialFrameworkEngineVersion,
  EngineStatus,
  ModuleState,
  ModuleType,
  AuthenticationMethod,
  FrameworkCapability,
  FinancialModuleDefinition,
  FinancialFrameworkRecord,
  NormalizedFinancialEvent,
  FinancialEventResult,
  AbstractedFinancialData,
  CredentialValidationResult,
  FinancialValidationReport,
  FrameworkRunReport,
  FrameworkHealthReport,
  FrameworkPerformanceStats,
  FinancialFrameworkState,
  FrameworkCockpitSnapshot,
  RegisterFinancialModuleInput,
  RouteFinancialEventInput,
  AbstractFinancialDataInput,
  RunDiagnosticsInput,
  IFinancialModulePlugin,
} from "./types.js";
