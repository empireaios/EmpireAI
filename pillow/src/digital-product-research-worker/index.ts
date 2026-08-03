export {
  DigitalProductResearchWorker,
  createDigitalProductResearchWorker,
  resetDigitalProductResearchWorkerForTesting,
  type DigitalProductResearchWorkerOptions,
} from "./engine.js";
export type { DigitalProductResearchWorkerDependencies } from "./integrations.js";
export {
  buildDigitalProductResearchWorkerConfiguration,
  DEFAULT_DIGITAL_PRODUCT_RESEARCH_WORKER_CONFIGURATION,
  type DigitalProductResearchWorkerConfiguration,
} from "./configuration.js";
export {
  DIGITAL_PRODUCT_RESEARCH_WORKER_ID,
  DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM_PATH,
  DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY,
  DPR_METADATA_VERSION,
  DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION,
  PRODUCT_CATEGORIES as DPR_PRODUCT_CATEGORIES,
  DISCOVERY_SOURCES as DPR_DISCOVERY_SOURCES,
  APPROVED_RESEARCH_SOURCES as DPR_APPROVED_RESEARCH_SOURCES,
  PRIORITY_LEVELS as DPR_PRIORITY_LEVELS,
  EVIDENCE_KINDS as DPR_EVIDENCE_KINDS,
  DEMAND_LEVELS as DPR_DEMAND_LEVELS,
  DPR_CAPABILITIES,
  INTEGRATION_TARGETS as DPR_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  DigitalProductResearchWorkerState,
  DigitalProductResearchReport as DprDigitalProductResearchReport,
  DigitalProductResearchReport,
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerRunReport,
  DigitalProductResearchWorkerCatalog,
  DigitalProductResearchWorkerCockpitSnapshot,
  DigitalProductResearchWorkerEngineRecord,
  DigitalProductResearchWorkerValidationReport,
  EvidenceItem as DprEvidenceItem,
  ProductCategory as DprProductCategory,
  DiscoverySource as DprDiscoverySource,
  PriorityLevel as DprPriorityLevel,
  EvidenceKind as DprEvidenceKind,
  DemandLevel as DprDemandLevel,
  IntegrationHandshake as DprIntegrationHandshake,
} from "./types.js";
export { resetResearchSequenceForTesting } from "./research-builder.js";
export { appendDprLog, getDprLogs, resetDprLogsForTesting } from "./dpr-logging.js";
