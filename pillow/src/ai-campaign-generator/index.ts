/** PILLOW-ACG-001 — AI Campaign Generator exports (R5-12). */

export {
  AiCampaignGenerator,
  createAiCampaignGenerator,
  resetAiCampaignGeneratorForTesting,
  type AiCampaignGeneratorDependencies,
} from "./engine.js";

export {
  buildAiCampaignGeneratorConfiguration,
  DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION,
  type AiCampaignGeneratorConfiguration,
} from "./configuration.js";

export {
  AI_CAMPAIGN_GENERATOR_SYSTEM_PATH,
  ACG_METADATA_VERSION,
  AI_CAMPAIGN_GENERATOR_ID,
  ACG_CAPABILITIES,
  CAMPAIGN_OBJECTIVES,
  MARKETING_CHANNELS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AiCampaignGeneratorEngineVersion,
  AiCampaignEngineRecord,
  AiCampaignRecord,
  AiCampaignRunReport,
  AiCampaignGeneratorState,
  AiCampaignCockpitSnapshot,
  AiCampaignHealthReport,
  AiCampaignPerformanceStats,
  ConnectAiCampaignGeneratorInput,
  GenerateCampaignInput,
  GenerateStrategyInput,
  RecommendInput,
  AcgCapability,
  CampaignObjective,
  MarketingChannel,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
