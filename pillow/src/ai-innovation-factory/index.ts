export {

  AiInnovationFactory,

  createAiInnovationFactory,

  resetAiInnovationFactoryForTesting,

  type AiInnovationFactoryOptions,

} from "./engine.js";

export { AiInnovationFactoryController } from "./ai-innovation-factory-controller.js";

export { AiInnovationFactoryManager } from "./ai-innovation-factory-manager.js";

export {

  IntegrationCoordinator,

  verifyIntegrations,

  type AiInnovationFactoryDependencies,

} from "./integrations.js";

export {

  DEFAULT_AI_INNOVATION_FACTORY_CONFIGURATION,

  buildAiInnovationFactoryConfiguration,

  type AiInnovationFactoryConfiguration,

} from "./configuration.js";

export { isForbiddenMissionId, isGkAuthorised } from "./mission-guard.js";

export {

  AI_INNOVATION_FACTORY_SYSTEM_PATH,

  AI_INNOVATION_FACTORY_ID,

  AIFRT_METADATA_VERSION,

  AI_INNOVATION_FACTORY_REPORT_VERSION,

  AIFRT_MISSION_ID,

  AI_INNOVATION_FACTORY_RUNTIME_VERSION,

  AIFRT_CAPABILITIES,

  INNOVATION_CATEGORIES,

  APPROVAL_STATUSES,

  PRIORITY_LEVELS,

  RESEARCH_CATALOG,

} from "./paths.js";

export * from "./types.js";

export {

  verifySeriesCompletePrerequisite,

  researchEmergingTechnologies,

  trackModelsAndApis,

  discoverBusinessOpportunities,

  evaluateArchitecturalImprovements,

  analyseOperationalImprovements,

  prioritiseInnovationProposals,

  generateImplementationRecommendations,

  buildInnovationProposals,

} from "./evidence-collector.js";

export { AifrtValidator, HealthMonitor, GateManager } from "./audit-validator.js";

export { AuditStore, nextReportId, resetAifrtSequenceForTesting } from "./audit-store.js";

export { buildCatalog, buildReport } from "./report-builder.js";

export { appendAifrtLog, getAifrtLogs, resetAifrtLogsForTesting } from "./aifrt-logging.js";


