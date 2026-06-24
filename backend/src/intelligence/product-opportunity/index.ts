export {
  OPPORTUNITY_SIGNAL_TYPES,
  opportunitySignalSchema,
  validateOpportunitySignal,
} from "./models/opportunity-signal.js";
export type { OpportunitySignal, OpportunitySignalType } from "./models/opportunity-signal.js";

export {
  OPPORTUNITY_TIERS,
  productOpportunitySchema,
  validateProductOpportunity,
  resolveOpportunityTier,
} from "./models/product-opportunity.js";
export type {
  ProductOpportunity,
  ProductOpportunityId,
  ProductOpportunityCreateInput,
  ProductOpportunityUpdateInput,
  OpportunityTier,
} from "./models/product-opportunity.js";

export type {
  OpportunityListQuery,
  OpportunityRepository,
} from "./repositories/opportunity-repository.js";

export {
  InMemoryOpportunityRepository,
  createInMemoryOpportunityRepository,
} from "./repositories/in-memory-opportunity-repository.js";

export {
  OPPORTUNITY_SIGNAL_WEIGHTS,
  scoreProductOpportunity,
  opportunityScoring,
} from "./scoring/opportunity-scoring.js";
export type { OpportunityScoreBreakdown } from "./scoring/opportunity-scoring.js";

export {
  ProductOpportunityEngine,
  defaultProductOpportunityEngine,
} from "./engines/product-opportunity-engine.js";
export type { ProductOpportunityEvaluationInput } from "./engines/product-opportunity-engine.js";

export {
  OPPORTUNITY_MODULE_ID,
  OPPORTUNITY_MODULE_VERSION,
  OPPORTUNITY_CAPABILITIES,
  OPPORTUNITY_MODULE_CONTRACT,
  OpportunityModule,
  createOpportunityModule,
  opportunityModule,
} from "./contract/opportunity-module.js";
export type {
  OpportunityModuleId,
  OpportunityCapability,
  OpportunityModuleContract,
} from "./contract/opportunity-module.js";
