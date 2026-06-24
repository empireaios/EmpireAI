export {
  BUYER_INTELLIGENCE_MODULE_ID,
  BUYER_INTELLIGENCE_MODULE_VERSION,
  BUYER_INTELLIGENCE_CAPABILITIES,
  BUYER_INTELLIGENCE_REQUIRED_INPUTS,
  BUYER_INTELLIGENCE_PRODUCED_OUTPUTS,
  BUYER_INTELLIGENCE_CATALOG_ENTRY,
} from "./contract/buyer-intelligence-contract.js";
export type {
  BuyerIntelligenceModuleId,
  BuyerIntelligenceCapability,
  BuyerIntelligenceInputSpec,
  BuyerIntelligenceOutputSpec,
  BuyerIntelligenceTask,
  BuyerIntelligenceValidationResult,
  BuyerIntelligenceHealthStatus,
  BuyerIntelligenceHealthReport,
  BuyerIntelligenceObservation,
  BuyerIntelligenceRecommendation,
  BuyerIntelligenceExecutionResult,
  BuyerIntelligenceModuleContract,
  BuyerIntelligenceCatalogEntry,
} from "./contract/buyer-intelligence-contract.js";

export type {
  BuyerPersona,
  BuyerPersonaId,
  BuyerDemographics,
  BuyerPsychographics,
  BuyerPersonaCreateInput,
  BuyerPersonaUpdateInput,
} from "./models/buyer-persona.js";
export {
  buyerPersonaSchema,
  validateBuyerPersona,
  normalizeBuyerPersonaSlug,
} from "./models/buyer-persona.js";

export type {
  BuyerIntent,
  BuyerIntentId,
  BuyerIntentStage,
  BuyerIntentUrgency,
  BuyerIntentSignal,
  BuyerIntentCreateInput,
  BuyerIntentUpdateInput,
} from "./models/buyer-intent.js";
export {
  BUYER_INTENT_STAGES,
  BUYER_INTENT_URGENCY_LEVELS,
  buyerIntentSchema,
  validateBuyerIntent,
  isPurchaseReadyIntent,
  urgencyWeight,
} from "./models/buyer-intent.js";

export type {
  NeedCategory,
  NeedCategoryId,
  NeedCategoryPriority,
  NeedCategoryCreateInput,
  NeedCategoryUpdateInput,
} from "./models/need-category.js";
export {
  NEED_CATEGORY_PRIORITIES,
  needCategorySchema,
  validateNeedCategory,
  needCategoryMatchesDomain,
} from "./models/need-category.js";

export type {
  PurchaseTrigger,
  PurchaseTriggerId,
  PurchaseTriggerType,
  PurchaseTriggerCondition,
  PurchaseTriggerCreateInput,
  PurchaseTriggerUpdateInput,
} from "./models/purchase-trigger.js";
export {
  PURCHASE_TRIGGER_TYPES,
  purchaseTriggerSchema,
  validatePurchaseTrigger,
  isPurchaseTriggerActiveAt,
} from "./models/purchase-trigger.js";

export type {
  AudienceSegment,
  AudienceSegmentId,
  AudienceSegmentStatus,
  SegmentRule,
  SegmentRuleOperator,
  AudienceSizeEstimate,
  SegmentMembership,
  SegmentMembershipId,
  AudienceSegmentCreateInput,
  AudienceSegmentUpdateInput,
} from "./models/audience-segment.js";
export {
  AUDIENCE_SEGMENT_STATUSES,
  audienceSegmentSchema,
  segmentMembershipSchema,
  validateAudienceSegment,
  validateSegmentMembership,
  isActiveAudienceSegment,
} from "./models/audience-segment.js";

export type {
  BuyerIntelligenceListQuery,
  BuyerPersonaQuery,
  BuyerIntentQuery,
  NeedCategoryQuery,
  PurchaseTriggerQuery,
  AudienceSegmentQuery,
  SegmentMembershipQuery,
  BuyerPersonaRepository,
  BuyerIntentRepository,
  NeedCategoryRepository,
  PurchaseTriggerRepository,
  AudienceSegmentRepository,
  SegmentMembershipRepository,
  BuyerIntelligenceRepository,
} from "./repositories/buyer-intelligence-repository.js";

export {
  InMemoryBuyerPersonaRepository,
  createInMemoryBuyerPersonaRepository,
} from "./repositories/in-memory-buyer-persona-repository.js";

export type {
  BuyerSignal,
  BuyerPersonaProfile,
  BuyerPersonaSpendingPower,
  BuyerPersonaUrgencyLevel,
  BuyerIntentContract,
} from "./persona-intelligence/index.js";
export {
  buyerSignalSchema,
  validateBuyerSignal,
  buyerSignalFromProductSignal,
  BUYER_PERSONA_SPENDING_POWERS,
  BUYER_PERSONA_URGENCY_LEVELS,
  buyerPersonaProfileSchema,
  validateBuyerPersonaProfile,
  buyerIntentContractSchema,
  validateBuyerIntentContract,
  BuyerPersonaMapper,
  defaultBuyerPersonaMapper,
} from "./persona-intelligence/index.js";

export {
  BUYER_INTELLIGENCE_TABLES,
  BUYER_INTELLIGENCE_INDEXES,
  BUYER_INTELLIGENCE_FOREIGN_KEYS,
  BUYER_INTELLIGENCE_OBSERVATION_DOMAINS,
  BUYER_INTELLIGENCE_SCHEMA_SQL_SKETCH,
} from "./schema/buyer-intelligence-schema.js";
export type {
  BuyerIntelligenceTableName,
  BiBuyerPersonaRow,
  BiBuyerIntentRow,
  BiNeedCategoryRow,
  BiPurchaseTriggerRow,
  BiAudienceSegmentRow,
  BiSegmentMembershipRow,
  BuyerIntelligenceIndexSpec,
  BuyerIntelligenceForeignKey,
} from "./schema/buyer-intelligence-schema.js";
