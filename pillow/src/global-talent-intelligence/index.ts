/** PILLOW-TAL-001 — Global Talent Intelligence exports (X4-13). */

export {
  GlobalTalentIntelligenceEngine,
  createGlobalTalentIntelligenceEngine,
  resetGlobalTalentIntelligenceForTesting,
  type GlobalTalentIntelligenceDependencies,
  type GlobalTalentIntelligenceOptions,
} from "./engine.js";

export {
  buildGlobalTalentIntelligenceConfiguration,
  DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION,
  type GlobalTalentIntelligenceConfiguration,
} from "./configuration.js";

export {
  GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH,
  TAL_METADATA_VERSION,
  GLOBAL_TALENT_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  TAL_CAPABILITIES,
  WORKFORCE_CATEGORIES,
  DECISION_STATUSES,
  RISK_LEVELS,
} from "./paths.js";

export type {
  GlobalTalentIntelligenceVersion,
  EngineStatus,
  OperationalState,
  TalCapability,
  ValidationStatus,
  HealthStatus,
  WorkforceCategory,
  DecisionStatus,
  RiskLevel,
  WorkforceIntelligenceRecord,
  GlobalTalentIntelligenceEngineRecord,
  WorkforceRecommendation,
  WorkforceValidationReport,
  TalRunReport,
  TalHealthReport,
  TalPerformanceStats,
  GlobalTalentIntelligenceState,
  TalCockpitSnapshot,
  ConnectGlobalTalentIntelligenceInput,
  WorkforceAnalysisInput,
  RunTalDiagnosticsInput,
} from "./types.js";
