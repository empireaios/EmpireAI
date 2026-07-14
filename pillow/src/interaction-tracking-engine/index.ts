export {
  createInteractionTrackingEngine,
  InteractionTrackingEngine,
  resetInteractionTrackingForTesting,
} from "./engine.js";
export {
  buildInteractionTrackingConfiguration,
  DEFAULT_INTERACTION_TRACKING_CONFIGURATION,
  effectiveTrackingIntervalMs,
} from "./configuration.js";
export {
  INTERACTION_TRACKING_SYSTEM_PATH,
  INTERACTION_EVENT_VERSION,
  INTERACTION_TYPES,
} from "./paths.js";
export type {
  InteractionTrackingState,
  InteractionEvent,
  RawInteractionInput,
  InteractionHealthReport,
  InteractionPerformanceStats,
  InteractionSessionState,
  InteractionTrackingCockpitSnapshot,
  TrackingStatus,
  InteractionType,
} from "./types.js";
export type { InteractionTrackingConfiguration } from "./configuration.js";
