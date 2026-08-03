/** PILLOW-IPE-001 — International Partnership Engine exports (X4-12). */

export {
  InternationalPartnershipEngine,
  createInternationalPartnershipEngine,
  resetInternationalPartnershipEngineForTesting,
  type InternationalPartnershipEngineDependencies,
  type InternationalPartnershipEngineOptions,
} from "./engine.js";

export {
  buildInternationalPartnershipEngineConfiguration,
  DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION,
  type InternationalPartnershipEngineConfiguration,
} from "./configuration.js";

export {
  INTERNATIONAL_PARTNERSHIP_ENGINE_SYSTEM_PATH,
  IPE_METADATA_VERSION,
  INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  IPE_CAPABILITIES,
  PARTNERSHIP_CATEGORIES,
  APPROVAL_STATUSES,
  RISK_LEVELS,
} from "./paths.js";

export type {
  InternationalPartnershipEngineVersion,
  EngineStatus,
  OperationalState,
  IpeCapability,
  ValidationStatus,
  HealthStatus,
  PartnershipCategory,
  ApprovalStatus,
  RiskLevel,
  PartnershipRecord,
  InternationalPartnershipEngineRecord,
  PartnershipRecommendation,
  PartnershipValidationReport,
  IpeRunReport,
  IpeHealthReport,
  IpePerformanceStats,
  InternationalPartnershipEngineState,
  IpeCockpitSnapshot,
  ConnectInternationalPartnershipEngineInput,
  PartnershipAnalysisInput,
  RunIpeDiagnosticsInput,
} from "./types.js";
