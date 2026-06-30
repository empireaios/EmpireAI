export {
  OFFER_SIGNAL_TYPES,
  offerSignalSchema,
  validateOfferSignal,
} from "./models/offer-signal.js";
export type { OfferSignalType, OfferSignal } from "./models/offer-signal.js";

export {
  OFFER_STYLES,
  productOfferSchema,
  validateProductOffer,
} from "./models/product-offer.js";
export type {
  ProductOfferId,
  OfferStyle,
  ProductOffer,
  ProductOfferCreateInput,
} from "./models/product-offer.js";

export type {
  OfferRepositoryQuery,
  OfferRepository,
} from "./repositories/offer-repository.js";

export {
  InMemoryOfferRepository,
  createInMemoryOfferRepository,
} from "./repositories/in-memory-offer-repository.js";

export {
  OFFER_SIGNAL_WEIGHTS,
  scoreProductOffer,
  scoreProductOffers,
  offerScoring,
} from "./scoring/offer-scoring.js";
export type {
  OfferBrandInput,
  OfferBrandProductInput,
  OfferProductKnowledgeInput,
  ProductOfferGenerationInput,
  ProductOfferBreakdown,
} from "./scoring/offer-scoring.js";

export {
  ProductOfferGenerationEngine,
  defaultProductOfferGenerationEngine,
} from "./engines/product-offer-generation-engine.js";

export {
  PRODUCT_OFFER_GENERATION_MODULE_ID,
  PRODUCT_OFFER_GENERATION_MODULE_VERSION,
  PRODUCT_OFFER_GENERATION_CAPABILITIES,
  PRODUCT_OFFER_GENERATION_MODULE_CONTRACT,
  ProductOfferGenerationModule,
  createProductOfferGenerationModule,
  productOfferGenerationModule,
} from "./contract/product-offer-generation-module.js";
export type {
  ProductOfferGenerationModuleId,
  ProductOfferGenerationCapability,
  ProductOfferGenerationModuleContract,
} from "./contract/product-offer-generation-module.js";
