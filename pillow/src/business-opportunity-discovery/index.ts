/** PILLOW-BOD-001 — Business Opportunity Discovery exports (X1-02). */

export {
  BusinessOpportunityDiscovery,
  createBusinessOpportunityDiscovery,
  resetBusinessOpportunityDiscoveryForTesting,
  type BusinessOpportunityDiscoveryDependencies,
} from "./engine.js";

export {
  buildBusinessOpportunityDiscoveryConfiguration,
  DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION,
  type BusinessOpportunityDiscoveryConfiguration,
} from "./configuration.js";

export {
  BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH,
  BOD_METADATA_VERSION,
  BUSINESS_OPPORTUNITY_DISCOVERY_ID,
  BOD_CAPABILITIES,
  OPPORTUNITY_CATEGORIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  BusinessOpportunityDiscoveryVersion,
  OpportunityEngineRecord,
  OpportunityRecord,
  OpportunityRunReport,
  BusinessOpportunityDiscoveryState,
  OpportunityCockpitSnapshot,
  OpportunityHealthReport,
  OpportunityPerformanceStats,
  ConnectBusinessOpportunityDiscoveryInput,
  DiscoverOpportunitiesInput,
  OpportunityActionInput,
  BodCapability,
  OpportunityCategory,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
