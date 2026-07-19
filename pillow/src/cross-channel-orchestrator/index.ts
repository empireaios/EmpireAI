/** PILLOW-CCO-001 — Cross-Channel Orchestrator exports (R5-18). */

export {
  CrossChannelOrchestrator,
  createCrossChannelOrchestrator,
  resetCrossChannelOrchestratorForTesting,
  type CrossChannelOrchestratorDependencies,
} from "./engine.js";

export {
  buildCrossChannelOrchestratorConfiguration,
  DEFAULT_CROSS_CHANNEL_ORCHESTRATOR_CONFIGURATION,
  type CrossChannelOrchestratorConfiguration,
} from "./configuration.js";

export {
  CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH,
  CCO_METADATA_VERSION,
  CROSS_CHANNEL_ORCHESTRATOR_ID,
  CCO_CAPABILITIES,
  MARKETING_CHANNELS,
  SYNC_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  CrossChannelOrchestratorVersion,
  OrchestrationEngineRecord,
  OrchestrationRecord,
  OrchestrationRunReport,
  CrossChannelOrchestratorState,
  OrchestrationCockpitSnapshot,
  OrchestrationHealthReport,
  OrchestrationPerformanceStats,
  ConnectCrossChannelOrchestratorInput,
  CoordinateCampaignsInput,
  OrchestrationActionInput,
  CcoCapability,
  MarketingChannel,
  SyncStatus,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
