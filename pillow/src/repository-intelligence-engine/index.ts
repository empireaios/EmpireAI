export {
  RepositoryIntelligenceEngine,
  createRepositoryIntelligenceEngine,
  resetRepositoryIntelligenceEngineForTesting,
  type RepositoryIntelligenceEngineOptions,
} from "./engine.js";
export { RepositoryIntelligenceEngineController } from "./repository-intelligence-engine-controller.js";
export { RepositoryIntelligenceEngineManager } from "./repository-intelligence-engine-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type RepositoryIntelligenceEngineDependencies,
} from "./integrations.js";
export {
  DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION,
  buildRepositoryIntelligenceEngineConfiguration,
  type RepositoryIntelligenceEngineConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId, isQ1301MissionId } from "./mission-guard.js";
export {
  REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  REPOSITORY_INTELLIGENCE_ENGINE_ID,
  RIENG_METADATA_VERSION,
  REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION,
  RIENG_MISSION_ID,
  REPOSITORY_INTELLIGENCE_ENGINE_RUNTIME_VERSION,
  RIENG_CAPABILITIES,
  ARCHITECTURE_LAYERS,
  DEFAULT_INCLUDE_ROOTS,
  DEFAULT_EXCLUDE_DIRS,
} from "./paths.js";
export * from "./types.js";
export {
  buildModuleInventory,
  buildServiceInventory,
  buildDependencyGraph,
  buildIntegrationGraph,
  buildArchitectureLayers,
  detectExistingImplementations,
  identifyReusableComponents,
  detectTechnicalDebt,
  detectConflictsAndDuplicates,
  observeQ1301Contract,
  observeQ1302Contract,
  verifyQ1302Prerequisite,
  verifyQ1301MissionPrerequisite,
  buildRepositorySnapshot,
  scanRepository,
  computeRepositoryFingerprint,
} from "./evidence-collector.js";
export { RiengValidator, HealthMonitor, GateManager } from "./audit-validator.js";
export { AuditStore, nextReportId, resetRiengSequenceForTesting } from "./audit-store.js";
export { buildCatalog, buildReport } from "./report-builder.js";
export { appendRiengLog, getRiengLogs, resetRiengLogsForTesting } from "./rieng-logging.js";
