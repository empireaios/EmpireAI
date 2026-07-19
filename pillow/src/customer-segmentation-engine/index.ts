export {
  CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH,
  CUSTOMER_SEGMENTATION_ENGINE_ID,
  CSEG_METADATA_VERSION,
  CSEG_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  SEGMENT_TYPES,
  VALUE_TIERS,
  RISK_TIERS,
  BEHAVIOUR_PROFILES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerSegmentationEngineConfiguration,
  DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION,
  type CustomerSegmentationEngineConfiguration,
  type SegmentationRule,
  type ClassificationRule,
  type DynamicUpdateRule,
} from "./configuration.js";

export {
  CustomerSegmentationEngine,
  createCustomerSegmentationEngine,
  resetCustomerSegmentationEngineForTesting,
  type CustomerSegmentationEngineOptions,
} from "./engine.js";

export type {
  CustomerSegmentationEngineVersion,
  CustomerSegmentationEngineState,
  SegmentationEngineRecord,
  CustomerSegment,
  SegmentationRecord,
  SegmentChange,
  SegmentationFailure,
  SegmentationValidationReport,
  SegmentationRunReport,
  SegmentationHealthReport,
  SegmentationPerformanceStats,
  SegmentationCockpitSnapshot,
  ConnectSegmentationEngineInput,
  CreateCustomerSegmentInput,
  AssignCustomerToSegmentsInput,
  SegmentCustomerInput,
  DetectSegmentChangesInput,
  DetectSegmentationFailuresInput,
  EngineStatus,
  EngineState,
  SegmentType,
  ValueTier,
  RiskTier,
  BehaviourProfile,
  HealthStatus,
} from "./types.js";

export { appendCsegLog, getCsegLogs, resetCsegLogsForTesting } from "./cseg-logging.js";
