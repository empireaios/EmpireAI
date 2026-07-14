export {
  UxOpportunityDiscoveryEngine,
  createUxOpportunityDiscoveryEngine,
  resetUxOpportunityDiscoveryForTesting,
} from "./engine.js";
export type { UxOpportunityDiscoveryOptions } from "./engine.js";

export {
  buildUxOpportunityDiscoveryConfiguration,
  DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION,
} from "./configuration.js";
export type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";

export {
  UX_OPPORTUNITY_DISCOVERY_SYSTEM_PATH,
  OPPORTUNITY_METADATA_VERSION,
  OPPORTUNITY_CATEGORIES,
} from "./paths.js";

export type {
  UxOpportunityDiscoveryState,
  UxOpportunityDiscoveryCockpitSnapshot,
  OpportunityDiscoveryRunReport,
  OpportunityRecord,
  DiscoverySessionRecord,
  UxOpportunityDiscoveryInput,
  DiscoveryHealthReport,
  DiscoveryPerformanceStats,
  UxOpportunityDiscoveryPerformanceStats,
  OpportunityCategory,
  OpportunityPriority,
  ComplexityLevel,
} from "./types.js";
