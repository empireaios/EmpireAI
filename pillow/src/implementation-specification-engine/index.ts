export {
  ImplementationSpecificationEngine,
  createImplementationSpecificationEngine,
  resetImplementationSpecificationEngineForTesting,
  type ImplementationSpecificationEngineOptions,
} from "./engine.js";
export { ImplementationSpecificationEngineController } from "./implementation-specification-engine-controller.js";
export { ImplementationSpecificationEngineManager } from "./implementation-specification-engine-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type ImplementationSpecificationEngineDependencies,
} from "./integrations.js";
export {
  DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION,
  buildImplementationSpecificationEngineConfiguration,
  type ImplementationSpecificationEngineConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId } from "./mission-guard.js";
export {
  IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM_PATH,
  IMPLEMENTATION_SPECIFICATION_ENGINE_ID,
  ISENG_METADATA_VERSION,
  IMPLEMENTATION_SPECIFICATION_REPORT_VERSION,
  ISENG_MISSION_ID,
  IMPLEMENTATION_SPECIFICATION_RUNTIME_VERSION,
  ISENG_CAPABILITIES,
  KNOWN_SCAN_ROOTS,
} from "./paths.js";
export * from "./types.js";
export {
  parseApprovedRoadmapMission,
  analyseRepositoryArchitecture,
  discoverImplementationDependencies,
  detectExistingImplementationsToPreserve,
  generateImplementationSpecification,
} from "./evidence-collector.js";
export { IsengValidator, HealthMonitor, GateManager } from "./audit-validator.js";
export { AuditStore, nextReportId, resetIsengSequenceForTesting } from "./audit-store.js";
export { buildCatalog, buildReport } from "./report-builder.js";
export { appendIsengLog, getIsengLogs, resetIsengLogsForTesting } from "./iseng-logging.js";
