/** PILLOW-CFF-001 — Company Factory Framework exports (X1-01). */

export {
  CompanyFactoryFrameworkEngine,
  createCompanyFactoryFrameworkEngine,
  resetCompanyFactoryFrameworkForTesting,
} from "./engine.js";

export {
  buildCompanyFactoryFrameworkConfiguration,
  DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION,
  type CompanyFactoryFrameworkConfiguration,
} from "./configuration.js";

export {
  COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH,
  COMPANY_FACTORY_METADATA_VERSION,
  ENGINE_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  CompanyFactoryFrameworkEngineVersion,
  EngineStatus,
  ModuleState,
  ModuleType,
  AuthenticationMethod,
  FrameworkCapability,
  CompanyModuleDefinition,
  CompanyFactoryFrameworkRecord,
  NormalizedCompanyEvent,
  CompanyEventResult,
  AbstractedCompanyData,
  CredentialValidationResult,
  CompanyValidationReport,
  FrameworkRunReport,
  FrameworkHealthReport,
  FrameworkPerformanceStats,
  CompanyFactoryFrameworkState,
  FrameworkCockpitSnapshot,
  RegisterCompanyModuleInput,
  RouteCompanyEventInput,
  AbstractCompanyDataInput,
  RunDiagnosticsInput,
  ICompanyModulePlugin,
} from "./types.js";
