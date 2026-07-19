/** PILLOW-TME-001 — Ticket Management Engine (R4-09). */

export {
  TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH,
  TME_METADATA_VERSION,
  TICKET_MANAGEMENT_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  RESOLUTION_STATUSES,
  TME_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildTicketManagementEngineConfiguration,
  loadTicketManagementEngineConfigFile,
  DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION,
  type TicketManagementEngineConfiguration,
  type ClassificationRule,
  type PriorityRule,
  type AssignmentRule,
  type EscalationRule,
} from "./configuration.js";

export type {
  TicketManagementEngineVersion,
  EngineStatus,
  EngineState,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ResolutionStatus,
  TmeCapability,
  ValidationStatus,
  HealthStatus,
  TicketEngineRecord,
  TicketRecord,
  TicketFailure,
  TicketValidationReport,
  TicketRunReport,
  TicketHealthReport,
  TicketPerformanceStats,
  TicketCockpitSnapshot,
  TmeLogEntry,
  ConnectTicketManagementEngineInput,
  CreateSupportTicketInput,
  ClassifyTicketCategoryInput,
  AssignTicketPriorityInput,
  AssignTicketOwnershipInput,
  TrackTicketLifecycleInput,
  LinkTicketToCustomerInput,
  LinkTicketToConversationInput,
  LinkTicketToTimelineInput,
  DetectOverdueTicketsInput,
  DetectStalledTicketsInput,
  DetectTicketFailuresInput,
  TicketManagementEngineState,
} from "./types.js";

export {
  TicketManagementEngine,
  createTicketManagementEngine,
  resetTicketManagementEngineForTesting,
  type TicketManagementEngineOptions,
} from "./engine.js";

export { TicketManagementManager } from "./ticket-management-manager.js";
export { TicketManagementController } from "./ticket-management-controller.js";
export { TicketCreationEngine } from "./ticket-creation-engine.js";
export { TicketClassificationEngine } from "./ticket-classification-engine.js";
export { TicketAssignmentEngine } from "./ticket-assignment-engine.js";
export { TicketWorkflowEngine } from "./ticket-workflow-engine.js";
export { TicketTimelineMapper } from "./ticket-timeline-mapper.js";
export { TicketAnalyticsEngine } from "./ticket-analytics-engine.js";
export { TicketValidationEngine } from "./ticket-validation-engine.js";
export { TicketMetadataGenerator } from "./ticket-metadata-generator.js";
export { TicketValidator } from "./ticket-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { TicketRegistry } from "./ticket-registry.js";
export { appendTmeLog, getTmeLogs, resetTmeLogsForTesting } from "./tme-logging.js";
