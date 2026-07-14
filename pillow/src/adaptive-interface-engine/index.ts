export {
  AdaptiveInterfaceEngine,
  createAdaptiveInterfaceEngine,
  resetAdaptiveInterfaceForTesting,
} from "./engine.js";
export type { AdaptiveInterfaceOptions } from "./engine.js";

export {
  buildAdaptiveInterfaceConfiguration,
  DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION,
} from "./configuration.js";
export type { AdaptiveInterfaceConfiguration } from "./configuration.js";

export {
  ADAPTIVE_INTERFACE_SYSTEM_PATH,
  ADAPTIVE_METADATA_VERSION,
  ADAPTATION_CATEGORIES,
} from "./paths.js";

export type {
  AdaptiveInterfaceState,
  AdaptiveInterfaceCockpitSnapshot,
  AdaptiveInterfaceRunReport,
  AdaptiveInterfaceRecord,
  AdaptiveInterfaceProfile,
  AdaptationSessionRecord,
  AdaptiveInterfaceInput,
  AdaptiveHealthReport,
  AdaptivePerformanceStats,
  AdaptationCategory,
  AdaptationPriority,
} from "./types.js";
