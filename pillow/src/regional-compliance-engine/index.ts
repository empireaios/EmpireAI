/** PILLOW-RCE-001 — Regional Compliance Engine exports (X4-06). */

export {
  RegionalComplianceEngine,
  createRegionalComplianceEngine,
  resetRegionalComplianceEngineForTesting,
  type RegionalComplianceEngineDependencies,
  type RegionalComplianceEngineOptions,
} from "./engine.js";

export {
  buildRegionalComplianceEngineConfiguration,
  DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION,
  type RegionalComplianceEngineConfiguration,
} from "./configuration.js";

export {
  REGIONAL_COMPLIANCE_ENGINE_SYSTEM_PATH,
  RCE_METADATA_VERSION,
  REGIONAL_COMPLIANCE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RCE_CAPABILITIES,
  REGULATION_CATEGORIES,
  COMPLIANCE_STATUSES,
  RISK_LEVELS,
} from "./paths.js";

export type {
  RegionalComplianceEngineVersion,
  EngineStatus,
  OperationalState,
  RceCapability,
  ValidationStatus,
  HealthStatus,
  RegulationCategory,
  ComplianceStatus,
  RiskLevel,
  ComplianceRecord,
  RegionalComplianceEngineRecord,
  ComplianceRecommendation,
  ComplianceValidationReport,
  RceRunReport,
  RceHealthReport,
  RcePerformanceStats,
  RegionalComplianceEngineState,
  RceCockpitSnapshot,
  ConnectRegionalComplianceEngineInput,
  ComplianceAnalysisInput,
  RunRceDiagnosticsInput,
} from "./types.js";
