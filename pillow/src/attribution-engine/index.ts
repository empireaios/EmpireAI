/** PILLOW-ATT-001 — Attribution Engine exports (R5-09). */

export {
  AttributionEngine,
  createAttributionEngine,
  resetAttributionEngineForTesting,
  type AttributionEngineDependencies,
} from "./engine.js";

export {
  buildAttributionEngineConfiguration,
  DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION,
  type AttributionEngineConfiguration,
} from "./configuration.js";

export {
  ATTRIBUTION_ENGINE_SYSTEM_PATH,
  ATT_METADATA_VERSION,
  ATTRIBUTION_ENGINE_ID,
  ATT_CAPABILITIES,
  ATTRIBUTION_MODELS,
  MARKETING_CHANNELS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AttributionEngineVersion,
  AttributionEngineRecord,
  AttributionRecord,
  TouchpointRecord,
  AttributionRunReport,
  AttributionEngineState,
  AttributionCockpitSnapshot,
  AttributionHealthReport,
  AttributionPerformanceStats,
  ConnectAttributionEngineInput,
  TrackAcquisitionSourceInput,
  TrackTouchpointInput,
  TrackConversionJourneyInput,
  AttributeInput,
  MeasureContributionInput,
  CalculateRoiInput,
  AttCapability,
  AttributionModel,
  MarketingChannel,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
