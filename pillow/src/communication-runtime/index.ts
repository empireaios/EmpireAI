export {
  CommunicationRuntime,
  createCommunicationRuntime,
  resetCommunicationRuntimeForTesting,
  type CommunicationRuntimeOptions,
} from "./engine.js";
export type { CommunicationRuntimeDependencies } from "./integrations.js";
export {
  buildCommunicationRuntimeConfiguration,
  DEFAULT_COMMUNICATION_RUNTIME_CONFIGURATION,
  type CommunicationRuntimeConfiguration,
} from "./configuration.js";
export {
  COMMUNICATION_RUNTIME_ID,
  COMMUNICATION_RUNTIME_SYSTEM_PATH,
  COMRT_METADATA_VERSION,
  COMRT_REPORT_VERSION,
  COMRT_RUNTIME_VERSION,
  COMRT_MISSION_ID,
  MESSAGE_TYPES,
  DELIVERY_STATUSES,
  CHANNEL_TYPES,
  PRIORITIES,
  COMRT_CAPABILITIES,
  INTEGRATION_TARGETS,
  ENGINE_STATUSES,
} from "./paths.js";
export type {
  ComrtInput,
  ComrtRunReport,
  ComrtValidationReport,
  ComrtEngineRecord,
  ComrtDiagnosticsSnapshot,
  Q1009ConsumableContract,
  CommunicationRuntimeReport,
  CommunicationRuntimeState,
  CommunicationRuntimeCockpitSnapshot,
  CommunicationMessage,
  CommunicationChannel,
  CollaborationSession,
  DeliveryRecord,
} from "./types.js";
export { FORBIDDEN_MISSION_ID, CONTEXT_REF_PATTERN } from "./communication-validator.js";
