export {

  AVAILABILITY_STATUSES,

  availabilityStatusSchema,

  validateAvailabilityStatus,

} from "./models/availability-status.js";

export type { AvailabilityStatus } from "./models/availability-status.js";



export {

  domainAlternativeSchema,

  validateDomainAlternative,

} from "./models/domain-alternative.js";

export type { DomainAlternative } from "./models/domain-alternative.js";



export {

  DOMAIN_SIGNAL_TYPES,

  domainSignalSchema,

  validateDomainSignal,

} from "./models/domain-signal.js";

export type { DomainSignalType, DomainSignal } from "./models/domain-signal.js";



export {

  domainRecommendationSchema,

  validateDomainRecommendation,

} from "./models/domain-recommendation.js";

export type {

  DomainRecommendationId,

  DomainRecommendation,

  DomainRecommendationCreateInput,

} from "./models/domain-recommendation.js";



export type {

  DomainIntelligenceRepositoryQuery,

  DomainIntelligenceRepository,

} from "./repositories/domain-intelligence-repository.js";



export {

  InMemoryDomainIntelligenceRepository,

  createInMemoryDomainIntelligenceRepository,

} from "./repositories/in-memory-domain-intelligence-repository.js";



export {

  DOMAIN_SIGNAL_WEIGHTS,

  scoreDomainIntelligence,

  domainIntelligenceScoring,

} from "./scoring/domain-intelligence-scoring.js";

export type {

  DomainIntelligenceBrandInput,

  DomainIntelligenceInput,

  DomainIntelligenceBreakdown,

} from "./scoring/domain-intelligence-scoring.js";



export {

  DomainIntelligenceEngine,

  defaultDomainIntelligenceEngine,

} from "./engines/domain-intelligence-engine.js";



export {

  DOMAIN_INTELLIGENCE_MODULE_ID,

  DOMAIN_INTELLIGENCE_MODULE_VERSION,

  DOMAIN_INTELLIGENCE_CAPABILITIES,

  DOMAIN_INTELLIGENCE_MODULE_CONTRACT,

  DomainIntelligenceModule,

  createDomainIntelligenceModule,

  domainIntelligenceModule,

} from "./contract/domain-intelligence-module.js";

export type {

  DomainIntelligenceModuleId,

  DomainIntelligenceCapability,

  DomainIntelligenceModuleContract,

} from "./contract/domain-intelligence-module.js";


