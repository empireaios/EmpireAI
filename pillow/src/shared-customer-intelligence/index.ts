/** PILLOW-SCI-001 — Shared Customer Intelligence exports (X2-12). */

export {
  SharedCustomerIntelligence,
  createSharedCustomerIntelligence,
  resetSharedCustomerIntelligenceForTesting,
  type SharedCustomerIntelligenceDependencies,
  type SharedCustomerIntelligenceOptions,
} from "./engine.js";

export {
  buildSharedCustomerIntelligenceConfiguration,
  DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION,
  type SharedCustomerIntelligenceConfiguration,
} from "./configuration.js";

export {
  SHARED_CUSTOMER_INTELLIGENCE_SYSTEM_PATH,
  SCI_METADATA_VERSION,
  SHARED_CUSTOMER_INTELLIGENCE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SCI_CAPABILITIES,
} from "./paths.js";

export { appendSciLog, getSciLogs, resetSciLogsForTesting } from "./sci-logging.js";

export type {
  SharedCustomerIntelligenceState,
  CustomerIntelligenceRecord,
  CustomerIntelligenceEngineRecord,
  CustomerIntelligenceRunReport,
  CustomerRiskSignal,
  CustomerIntelligenceRecommendation,
  CustomerIntelligenceCockpitSnapshot,
  CustomerIntelligenceHealthReport,
  CustomerIntelligencePerformanceStats,
  ConnectSharedCustomerIntelligenceInput,
  ConsolidateCustomerKnowledgeInput,
  ResolveCustomerIdentityInput,
  AnalyzeCustomerBehaviourInput,
  GenerateCustomerInsightsInput,
  DetectCrossSellInput,
  DetectCustomerRisksInput,
  RecommendCustomerIntelligenceInput,
  RunCustomerIntelligenceDiagnosticsInput,
} from "./types.js";
