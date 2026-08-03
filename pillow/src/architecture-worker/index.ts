export {

  ArchitectureWorker,

  createArchitectureWorker,

  resetArchitectureWorkerForTesting,

  type ArchitectureWorkerOptions,

} from "./engine.js";

export type { ArchitectureWorkerDependencies } from "./integrations.js";

export {

  buildArchitectureWorkerConfiguration,

  DEFAULT_ARCHITECTURE_WORKER_CONFIGURATION,

  type ArchitectureWorkerConfiguration,

} from "./configuration.js";

export {

  ARCHITECTURE_WORKER_ID,

  ARCHITECTURE_WORKER_SYSTEM_PATH,

  ARCHITECTURE_WORKER_IDENTITY,

  ARW_METADATA_VERSION,

  ARCHITECTURE_WORKER_REPORT_VERSION,

  ARCHITECTURE_DOMAINS as ARW_ARCHITECTURE_DOMAINS,

  ARCHITECTURAL_COMPLIANCE_LEVELS as ARW_ARCHITECTURAL_COMPLIANCE_LEVELS,

  ARW_CAPABILITIES,

  INTEGRATION_TARGETS as ARW_INTEGRATION_TARGETS,

} from "./paths.js";

export type {

  ArchitectureWorkerState,

  ArchitectureReport,

  ArchitectureReport as ArwArchitectureReport,

  ArchitectureWorkerInput,

  ArchitectureWorkerRunReport,

  ArchitectureWorkerCatalog,

  ArchitectureWorkerCockpitSnapshot,

  ArchitectureWorkerEngineRecord,

  ArchitectureWorkerValidationReport,

  ArchitectureStep as ArwArchitectureStep,

  ModuleArchitectureEntry as ArwModuleArchitectureEntry,

  ApiArchitectureEntry as ArwApiArchitectureEntry,

  DataFlowEntry as ArwDataFlowEntry,

  ServiceDependencyEntry as ArwServiceDependencyEntry,

  DeploymentArchitecture as ArwDeploymentArchitecture,

  IntegrationArchitectureEntry as ArwIntegrationArchitectureEntry,

  ArchitectureDomain as ArwArchitectureDomain,

  IntegrationHandshake as ArwIntegrationHandshake,

  SelfReviewFinding as ArwSelfReviewFinding,

  ArchitecturalDecision as ArwArchitecturalDecision,

} from "./types.js";

export { resetArchitectureSequenceForTesting } from "./architecture-builder.js";

export { appendArwLog, getArwLogs, resetArwLogsForTesting } from "./arw-logging.js";


