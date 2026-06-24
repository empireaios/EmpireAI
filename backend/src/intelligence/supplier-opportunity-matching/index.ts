export {
  SUPPLIER_MATCH_SIGNAL_TYPES,
  supplierMatchSignalSchema,
  validateSupplierMatchSignal,
} from "./models/supplier-match-signal.js";
export type { SupplierMatchSignal, SupplierMatchSignalType } from "./models/supplier-match-signal.js";

export {
  SUPPLIER_MATCH_TIERS,
  supplierOpportunityMatchSchema,
  validateSupplierOpportunityMatch,
  resolveSupplierMatchTier,
} from "./models/supplier-opportunity-match.js";
export type {
  SupplierOpportunityMatch,
  SupplierOpportunityMatchId,
  SupplierOpportunityMatchCreateInput,
  SupplierOpportunityMatchUpdateInput,
  SupplierMatchTier,
} from "./models/supplier-opportunity-match.js";

export type {
  SupplierOpportunityMatchingListQuery,
  MatchingRepository,
} from "./repositories/matching-repository.js";

export {
  InMemoryMatchingRepository,
  createInMemoryMatchingRepository,
} from "./repositories/in-memory-matching-repository.js";

export {
  SUPPLIER_OPPORTUNITY_SIGNAL_WEIGHTS,
  scoreSupplierOpportunityMatch,
  supplierOpportunityScoring,
} from "./scoring/supplier-opportunity-scoring.js";
export type {
  SupplierOpportunityScoreBreakdown,
  SupplierOpportunityMatchInput,
} from "./scoring/supplier-opportunity-scoring.js";

export {
  SupplierOpportunityMatcher,
  defaultSupplierOpportunityMatcher,
} from "./matchers/supplier-opportunity-matcher.js";

export {
  SUPPLIER_OPPORTUNITY_MODULE_ID,
  SUPPLIER_OPPORTUNITY_MODULE_VERSION,
  SUPPLIER_OPPORTUNITY_CAPABILITIES,
  SUPPLIER_OPPORTUNITY_MODULE_CONTRACT,
  SupplierOpportunityModule,
  createSupplierOpportunityModule,
  supplierOpportunityModule,
} from "./contract/supplier-opportunity-module.js";
export type {
  SupplierOpportunityModuleId,
  SupplierOpportunityCapability,
  SupplierOpportunityModuleContract,
} from "./contract/supplier-opportunity-module.js";
