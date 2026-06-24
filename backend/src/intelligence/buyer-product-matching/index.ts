export {
  MATCHING_SIGNAL_TYPES,
  matchingSignalSchema,
  validateMatchingSignal,
} from "./models/matching-signal.js";
export type { MatchingSignal, MatchingSignalType } from "./models/matching-signal.js";

export {
  MATCH_TIERS,
  buyerProductMatchSchema,
  validateBuyerProductMatch,
  resolveMatchTier,
} from "./models/buyer-product-match.js";
export type {
  BuyerProductMatch,
  BuyerProductMatchId,
  BuyerProductMatchCreateInput,
  BuyerProductMatchUpdateInput,
  MatchTier,
} from "./models/buyer-product-match.js";

export type { MatchingListQuery, MatchingRepository } from "./repositories/matching-repository.js";

export {
  InMemoryMatchingRepository,
  createInMemoryMatchingRepository,
} from "./repositories/in-memory-matching-repository.js";

export {
  MATCHING_SIGNAL_WEIGHTS,
  scoreBuyerProductMatch,
  matchingScoring,
} from "./scoring/matching-scoring.js";
export type { MatchingScoreBreakdown } from "./scoring/matching-scoring.js";

export {
  BuyerProductMatcher,
  defaultBuyerProductMatcher,
} from "./matchers/buyer-product-matcher.js";
export type { BuyerProductMatchInput } from "./matchers/buyer-product-matcher.js";

export {
  MATCHING_MODULE_ID,
  MATCHING_MODULE_VERSION,
  MATCHING_CAPABILITIES,
  MATCHING_MODULE_CONTRACT,
  MatchingModule,
  createMatchingModule,
  matchingModule,
} from "./contract/matching-module.js";
export type {
  MatchingModuleId,
  MatchingCapability,
  MatchingModuleContract,
} from "./contract/matching-module.js";
