/** PILLOW-MCR-001 — Multi-Company Registry exports (X2-02). */

export {
  MultiCompanyRegistry,
  createMultiCompanyRegistry,
  resetMultiCompanyRegistryForTesting,
  type MultiCompanyRegistryDependencies,
} from "./engine.js";

export {
  buildMultiCompanyRegistryConfiguration,
  DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION,
  type MultiCompanyRegistryConfiguration,
} from "./configuration.js";

export {
  MULTI_COMPANY_REGISTRY_SYSTEM_PATH,
  MCR_METADATA_VERSION,
  MULTI_COMPANY_REGISTRY_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  COMPANY_CATEGORIES,
  LIFECYCLE_STAGES,
  COMPANY_OPERATIONAL_STATUSES,
  MCR_CAPABILITIES,
} from "./paths.js";

export type {
  MultiCompanyRegistryVersion,
  EngineStatus,
  OperationalState,
  CompanyCategory,
  LifecycleStage,
  CompanyOperationalStatus,
  McrCapability,
  RegistryEngineRecord,
  CompanyRegistryRecord,
  RegistryRecommendation,
  RegistryValidationReport,
  RegistryRunReport,
  RegistryHealthReport,
  RegistryPerformanceStats,
  MultiCompanyRegistryState,
  RegistryCockpitSnapshot,
  ConnectMultiCompanyRegistryInput,
  RegisterCompanyInput,
  UpdateCompanyProfileInput,
  UpdateOwnershipInput,
  ClassifyCompanyInput,
  AdvanceLifecycleInput,
  DetectDuplicatesInput,
  RecommendRegistryInput,
  RunRegistryDiagnosticsInput,
} from "./types.js";
