/** PILLOW-CMM-001 — Competitor Marketing Monitor exports (R5-15). */

export {
  CompetitorMarketingMonitor,
  createCompetitorMarketingMonitor,
  resetCompetitorMarketingMonitorForTesting,
  type CompetitorMarketingMonitorDependencies,
} from "./engine.js";

export {
  buildCompetitorMarketingMonitorConfiguration,
  DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION,
  type CompetitorMarketingMonitorConfiguration,
} from "./configuration.js";

export {
  COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH,
  CMM_METADATA_VERSION,
  COMPETITOR_MARKETING_MONITOR_ID,
  CMM_CAPABILITIES,
  MARKETING_CHANNELS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  CompetitorMarketingMonitorVersion,
  CompetitorEngineRecord,
  CompetitorRecord,
  CompetitorRunReport,
  CompetitorMarketingMonitorState,
  CompetitorCockpitSnapshot,
  CompetitorHealthReport,
  CompetitorPerformanceStats,
  ConnectCompetitorMarketingMonitorInput,
  DiscoverCompetitorsInput,
  MonitorCompetitorsInput,
  GenerateIntelligenceInput,
  CmmCapability,
  MarketingChannel,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
