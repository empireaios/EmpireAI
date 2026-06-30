export {
  REVENUE_SIGNAL_TYPES,
  revenueSignalSchema,
  validateRevenueSignal,
} from "./models/revenue-signal.js";
export type { RevenueSignalType, RevenueSignal } from "./models/revenue-signal.js";

export {
  REVENUE_OPPORTUNITY_TYPES,
  revenueOpportunitySchema,
  validateRevenueOpportunity,
} from "./models/revenue-opportunity.js";
export type {
  RevenueOpportunityId,
  RevenueOpportunityType,
  RevenueOpportunity,
  RevenueOpportunityCreateInput,
} from "./models/revenue-opportunity.js";

export type {
  RevenueOpportunityRepositoryQuery,
  RevenueOpportunityRepository,
} from "./repositories/revenue-opportunity-repository.js";

export {
  InMemoryRevenueOpportunityRepository,
  createInMemoryRevenueOpportunityRepository,
} from "./repositories/in-memory-revenue-opportunity-repository.js";

export {
  REVENUE_SIGNAL_WEIGHTS,
  scoreRevenueOpportunity,
  revenueOpportunityScoring,
} from "./scoring/revenue-opportunity-scoring.js";
export type {
  RevenueOpportunityInput,
  RevenueLaunchDecisionInput,
  RevenueForecastInput,
  RevenueTrustInput,
  RevenueLearningInput,
  RevenueOpportunitySynthesisInput,
  RevenueOpportunityScoreBreakdown,
} from "./scoring/revenue-opportunity-scoring.js";

export {
  RevenueOpportunitySynthesisEngine,
  defaultRevenueOpportunitySynthesisEngine,
} from "./engines/revenue-opportunity-synthesis-engine.js";

export {
  REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_ID,
  REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_VERSION,
  REVENUE_OPPORTUNITY_SYNTHESIS_CAPABILITIES,
  REVENUE_OPPORTUNITY_SYNTHESIS_MODULE_CONTRACT,
  RevenueOpportunityModule,
  createRevenueOpportunityModule,
  revenueOpportunityModule,
} from "./contract/revenue-opportunity-module.js";
export type {
  RevenueOpportunitySynthesisModuleId,
  RevenueOpportunitySynthesisCapability,
  RevenueOpportunitySynthesisModuleContract,
} from "./contract/revenue-opportunity-module.js";
