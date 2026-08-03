/** PILLOW-CBK-001 — Cross-Business Knowledge Engine exports (X2-04). */

export {
  CrossBusinessKnowledgeEngine,
  createCrossBusinessKnowledgeEngine,
  resetCrossBusinessKnowledgeEngineForTesting,
  type CrossBusinessKnowledgeEngineDependencies,
} from "./engine.js";

export {
  buildCrossBusinessKnowledgeEngineConfiguration,
  DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION,
  type CrossBusinessKnowledgeEngineConfiguration,
} from "./configuration.js";

export {
  CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH,
  CBK_METADATA_VERSION,
  CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  KNOWLEDGE_CATEGORIES,
  DISTRIBUTION_STATUSES,
  CBK_CAPABILITIES,
} from "./paths.js";

export type {
  CrossBusinessKnowledgeEngineVersion,
  EngineStatus,
  OperationalState,
  KnowledgeCategory,
  DistributionStatus,
  CbkCapability,
  KnowledgeEngineRecord,
  KnowledgeRecord,
  KnowledgeRecommendation,
  KnowledgeValidationReport,
  KnowledgeRunReport,
  KnowledgeHealthReport,
  KnowledgePerformanceStats,
  CrossBusinessKnowledgeEngineState,
  KnowledgeCockpitSnapshot,
  ConnectCrossBusinessKnowledgeInput,
  CollectKnowledgeInput,
  ClassifyKnowledgeInput,
  ShareKnowledgeInput,
  DetectDuplicateKnowledgeInput,
  RankKnowledgeInput,
  RecommendKnowledgeInput,
  RunKnowledgeDiagnosticsInput,
} from "./types.js";
