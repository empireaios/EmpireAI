export {
  LocalMarketResearchWorker,
  createLocalMarketResearchWorker,
  resetLocalMarketResearchWorkerForTesting,
  type LocalMarketResearchWorkerOptions,
} from "./engine.js";
export type { LocalMarketResearchWorkerDependencies } from "./integrations.js";
export {
  buildLocalMarketResearchWorkerConfiguration,
  DEFAULT_LOCAL_MARKET_RESEARCH_WORKER_CONFIGURATION,
  type LocalMarketResearchWorkerConfiguration,
} from "./configuration.js";
export {
  LOCAL_MARKET_RESEARCH_WORKER_ID,
  LOCAL_MARKET_RESEARCH_WORKER_SYSTEM_PATH,
  LOCAL_MARKET_RESEARCH_WORKER_IDENTITY,
  LMRW_METADATA_VERSION,
  LOCAL_MARKET_RESEARCH_REPORT_VERSION,
  EVIDENCE_CLASSES,
  EVIDENCE_MODES,
  LMRW_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  LocalMarketResearchWorkerState,
  LocalMarketResearchReport,
  LocalMarketResearchInput,
  LocalMarketResearchWorkerRunReport,
  LocalMarketResearchWorkerCatalog,
  LocalMarketResearchWorkerCockpitSnapshot,
  LocalMarketResearchWorkerEngineRecord,
  LocalMarketResearchWorkerValidationReport,
  DemandFindings,
  CompetitorProfile,
  PricingFindings,
  PainPoint,
  ServiceGap,
  ServiceOpportunity,
  MarketAttractivenessAssessment,
  EvidenceRecord,
  EvidenceClass,
  EvidenceMode,
  ResearchFixturePayload,
  ResearchSession,
  ResearchContext,
  Q703ConsumableContract,
  IntegrationHandshake as LmrwIntegrationHandshake,
} from "./types.js";
