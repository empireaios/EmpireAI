export {
  AffiliateOpportunityWorker,
  createAffiliateOpportunityWorker,
  resetAffiliateOpportunityWorkerForTesting,
  type AffiliateOpportunityWorkerOptions,
} from "./engine.js";
export type { AffiliateOpportunityWorkerDependencies } from "./integrations.js";
export {
  buildAffiliateOpportunityWorkerConfiguration,
  DEFAULT_AFFILIATE_OPPORTUNITY_WORKER_CONFIGURATION,
  type AffiliateOpportunityWorkerConfiguration,
} from "./configuration.js";
export {
  AFFILIATE_OPPORTUNITY_WORKER_ID,
  AFFILIATE_OPPORTUNITY_WORKER_SYSTEM_PATH,
  AFFILIATE_OPPORTUNITY_WORKER_IDENTITY,
  AOW_METADATA_VERSION,
  AFFILIATE_OPPORTUNITY_REPORT_VERSION,
  EVIDENCE_MODES,
  AUDIT_STATUSES,
  RECOMMENDATION_STATUSES,
  AOW_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  AffiliateOpportunityWorkerState,
  AffiliateOpportunityReport,
  AowInput,
  AowRunReport,
  AffiliateOpportunityWorkerCatalog,
  AffiliateOpportunityWorkerCockpitSnapshot,
  AffiliateOpportunityWorkerEngineRecord,
  DiscoveredProgramme,
  DiscoveredProduct,
  ResearchedNiche,
  CommissionStructure,
  DemandAssessment,
  RankedOpportunity,
  OpportunityRisk,
  Q803ConsumableContract,
  EvidenceMode,
  RecommendationStatus,
  IntegrationHandshake as AowIntegrationHandshake,
} from "./types.js";
