export {
  TrendResearchWorker,
  createTrendResearchWorker,
  resetTrendResearchWorkerForTesting,
  type TrendResearchWorkerOptions,
} from "./engine.js";
export type { TrendResearchWorkerDependencies } from "./integrations.js";
export {
  buildTrendResearchWorkerConfiguration,
  DEFAULT_TREND_RESEARCH_WORKER_CONFIGURATION,
  type TrendResearchWorkerConfiguration,
} from "./configuration.js";
export {
  TREND_RESEARCH_WORKER_ID,
  TREND_RESEARCH_WORKER_SYSTEM_PATH,
  TREND_RESEARCH_WORKER_IDENTITY,
  TRW_METADATA_VERSION,
  TREND_RESEARCH_REPORT_VERSION,
  TREND_CATEGORIES,
  DISCOVERY_SOURCES,
  APPROVED_RESEARCH_SOURCES,
  TREND_DIRECTIONS,
  PRIORITY_LEVELS,
  EVIDENCE_KINDS,
  DEMAND_LEVELS,
  TRW_CAPABILITIES,
  INTEGRATION_TARGETS as TRW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  TrendResearchWorkerState,
  TrendResearchReport as TrwTrendResearchReport,
  TrendResearchReport,
  TrendResearchWorkerInput,
  TrendResearchWorkerRunReport,
  TrendResearchWorkerCatalog,
  TrendResearchWorkerCockpitSnapshot,
  TrendResearchWorkerEngineRecord,
  TrendResearchWorkerValidationReport,
  SignalScore as TrwSignalScore,
  EvidenceItem as TrwEvidenceItem,
  TrendCategory as TrwTrendCategory,
  DiscoverySource as TrwDiscoverySource,
  TrendDirection as TrwTrendDirection,
  PriorityLevel as TrwPriorityLevel,
  EvidenceKind as TrwEvidenceKind,
  DemandLevel as TrwDemandLevel,
  IntegrationHandshake as TrwIntegrationHandshake,
} from "./types.js";
export { resetTrendSequenceForTesting } from "./trend-builder.js";
export { appendTrwLog, getTrwLogs, resetTrwLogsForTesting } from "./trw-logging.js";
