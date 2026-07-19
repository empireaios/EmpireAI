/** PILLOW-CTE-001 — Customer Timeline Engine (R4-03). */

export {
  CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH,
  CTE_METADATA_VERSION,
  CUSTOMER_TIMELINE_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  EVENT_TYPES,
  EVENT_SOURCES,
  EVENT_STATUSES,
  CTE_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerTimelineEngineConfiguration,
  loadCustomerTimelineEngineConfigFile,
  DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION,
  type CustomerTimelineEngineConfiguration,
  type RetentionRule,
  type EventClassificationRule,
  type TimelineSearchRule,
} from "./configuration.js";

export type {
  CustomerTimelineEngineVersion,
  EngineStatus,
  EngineState,
  EventType,
  EventSource,
  EventStatus,
  CteCapability,
  ValidationStatus,
  HealthStatus,
  TimelineEngineRecord,
  TimelineRecord,
  TimelineValidationReport,
  TimelineSearchResult,
  TimelineRunReport,
  TimelineHealthReport,
  TimelinePerformanceStats,
  TimelineCockpitSnapshot,
  CteLogEntry,
  ConnectCustomerTimelineEngineInput,
  RecordTimelineEventInput,
  RecordCustomerInteractionInput,
  RecordPurchaseInput,
  RecordSupportActivityInput,
  RecordCommunicationInput,
  RecordAccountChangeInput,
  RecordCustomerMilestoneInput,
  SearchTimelineHistoryInput,
  CustomerTimelineEngineState,
} from "./types.js";

export {
  CustomerTimelineEngine,
  createCustomerTimelineEngine,
  resetCustomerTimelineEngineForTesting,
  type CustomerTimelineEngineOptions,
} from "./engine.js";

export { CustomerTimelineManager } from "./customer-timeline-manager.js";
export { CustomerTimelineController } from "./customer-timeline-controller.js";
export { TimelineEventEngine } from "./timeline-event-engine.js";
export { TimelineAggregationEngine } from "./timeline-aggregation-engine.js";
export { TimelineSearchEngine } from "./timeline-search-engine.js";
export { TimelineValidationEngine } from "./timeline-validation-engine.js";
export { TimelineMetadataGenerator } from "./timeline-metadata-generator.js";
export { TimelineValidator } from "./timeline-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { TimelineRegistry } from "./timeline-registry.js";
export { appendCteLog, getCteLogs, resetCteLogsForTesting } from "./cte-logging.js";
