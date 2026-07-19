/** PILLOW-SF-001 — Supplier Framework exports (R2-01). */

export {
  SupplierFrameworkEngine,
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "./engine.js";

export {
  buildSupplierFrameworkConfiguration,
  DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION,
  type SupplierFrameworkConfiguration,
} from "./configuration.js";

export {
  SUPPLIER_FRAMEWORK_SYSTEM_PATH,
  SUPPLIER_METADATA_VERSION,
  ENGINE_STATUSES,
  CONNECTOR_STATES,
  CONNECTOR_TYPES,
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  SupplierFrameworkEngineVersion,
  EngineStatus,
  ConnectorState,
  ConnectorType,
  AuthenticationMethod,
  FrameworkCapability,
  SupplierConnectorDefinition,
  SupplierFrameworkRecord,
  NormalizedSupplierEvent,
  SupplierEventResult,
  AbstractedSupplierData,
  AuthenticationResult,
  SupplierValidationReport,
  FrameworkRunReport,
  FrameworkHealthReport,
  FrameworkPerformanceStats,
  SupplierFrameworkState,
  FrameworkCockpitSnapshot,
  RegisterSupplierInput,
  RouteSupplierEventInput,
  AbstractSupplierDataInput,
  RunDiagnosticsInput,
  ISupplierConnectorPlugin,
} from "./types.js";
