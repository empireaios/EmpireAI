/** PILLOW-FO-001 — Fulfilment Orchestrator exports (R2-10). */

export {
  FulfilmentOrchestrator,
  createFulfilmentOrchestrator,
  resetFulfilmentOrchestratorForTesting,
} from "./engine.js";

export {
  buildFulfilmentOrchestratorConfiguration,
  DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION,
  type FulfilmentOrchestratorConfiguration,
} from "./configuration.js";

export {
  FULFILMENT_ORCHESTRATOR_SYSTEM_PATH,
  FO_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS as FULFILMENT_SUPPLIER_IDENTIFIERS,
  FULFILMENT_ROUTES,
  FULFILMENT_STATUSES,
  FAILURE_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type {
  FulfilmentOrchestratorVersion,
  FulfilmentRecord,
  FulfilmentReport,
  FulfilmentOrchestratorState,
  FulfilmentCockpitSnapshot,
  FulfilmentHealthReport,
  FulfilmentPerformanceStats,
  RouteFulfilmentInput,
  ReceiveFulfilmentRequirementsInput,
  RouteSelectionResult,
  FulfilmentRoute,
  FulfilmentStatus,
  FailureStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
