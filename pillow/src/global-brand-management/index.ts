/** PILLOW-GBM-001 — Global Brand Management exports (X4-11). */

export {
  GlobalBrandManagementEngine,
  createGlobalBrandManagementEngine,
  resetGlobalBrandManagementForTesting,
  type GlobalBrandManagementDependencies,
  type GlobalBrandManagementOptions,
} from "./engine.js";

export {
  buildGlobalBrandManagementConfiguration,
  DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION,
  type GlobalBrandManagementConfiguration,
} from "./configuration.js";

export {
  GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH,
  GBM_METADATA_VERSION,
  GLOBAL_BRAND_MANAGEMENT_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  GBM_CAPABILITIES,
  BRAND_CATEGORIES,
  COMPLIANCE_STATUSES,
  RISK_LEVELS,
} from "./paths.js";

export type {
  GlobalBrandManagementVersion,
  EngineStatus,
  OperationalState,
  GbmCapability,
  ValidationStatus,
  HealthStatus,
  BrandCategory,
  ComplianceStatus,
  RiskLevel,
  BrandGovernanceRecord,
  GlobalBrandManagementEngineRecord,
  BrandRecommendation,
  BrandValidationReport,
  GbmRunReport,
  GbmHealthReport,
  GbmPerformanceStats,
  GlobalBrandManagementState,
  GbmCockpitSnapshot,
  ConnectGlobalBrandManagementInput,
  BrandAnalysisInput,
  RunGbmDiagnosticsInput,
} from "./types.js";
