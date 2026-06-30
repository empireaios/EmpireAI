export {
  CAMPAIGN_OBJECTIVES,
  campaignObjectiveSchema,
  validateCampaignObjective,
  campaignObjectiveLabel,
  campaignObjectiveIntelligenceSchema,
  validateCampaignObjectiveIntelligence,
} from "./models/campaign-objective.js";
export type {
  CampaignObjective,
  CampaignObjectiveIntelligence,
} from "./models/campaign-objective.js";

export {
  MARKETING_CHANNELS,
  marketingChannelSchema,
  validateMarketingChannel,
  marketingChannelLabel,
  channelRecommendationSchema,
  validateChannelRecommendation,
} from "./models/channel-recommendation.js";
export type { MarketingChannel, ChannelRecommendation } from "./models/channel-recommendation.js";

export {
  audienceIntelligenceSchema,
  validateAudienceIntelligence,
} from "./models/audience-intelligence.js";
export type { AudienceIntelligence } from "./models/audience-intelligence.js";

export {
  budgetIntelligenceSchema,
  validateBudgetIntelligence,
} from "./models/budget-intelligence.js";
export type { BudgetIntelligence } from "./models/budget-intelligence.js";

export {
  CAMPAIGN_STRATEGY_TIERS,
  campaignStrategyTierSchema,
  validateCampaignStrategy,
  campaignStrategyTierLabel,
} from "./models/campaign-strategy.js";
export type { CampaignStrategyTier, CampaignStrategy } from "./models/campaign-strategy.js";

export {
  campaignRiskAssessmentSchema,
  validateCampaignRiskAssessment,
} from "./models/campaign-risk.js";
export type { CampaignRiskAssessment } from "./models/campaign-risk.js";

export {
  campaignRecommendationSchema,
  validateCampaignRecommendation,
} from "./models/campaign-recommendation.js";
export type { CampaignRecommendation } from "./models/campaign-recommendation.js";

export {
  CAMPAIGN_INTELLIGENCE_SIGNAL_TYPES,
  campaignIntelligenceSignalSchema,
  validateCampaignIntelligenceSignal,
} from "./models/campaign-intelligence-signal.js";
export type {
  CampaignIntelligenceSignalType,
  CampaignIntelligenceSignal,
} from "./models/campaign-intelligence-signal.js";

export {
  marketingCampaignIntelligenceSchema,
  validateMarketingCampaignIntelligence,
} from "./models/marketing-campaign-intelligence.js";
export type {
  MarketingCampaignIntelligenceId,
  MarketingCampaignIntelligence,
  MarketingCampaignIntelligenceCreateInput,
} from "./models/marketing-campaign-intelligence.js";

export {
  campaignIntelligenceRecordSchema,
  validateCampaignIntelligenceRecord,
} from "./models/campaign-intelligence-record.js";
export type {
  CampaignIntelligenceRecordId,
  CampaignIntelligenceRecord,
  CampaignIntelligenceRecordCreateInput,
} from "./models/campaign-intelligence-record.js";

export type {
  CampaignIntelligenceRepositoryQuery,
  CampaignIntelligenceRepository,
} from "./repositories/campaign-intelligence-repository.js";

export {
  InMemoryCampaignIntelligenceRepository,
  createInMemoryCampaignIntelligenceRepository,
} from "./repositories/in-memory-campaign-intelligence-repository.js";

export {
  CAMPAIGN_INTELLIGENCE_SIGNAL_WEIGHTS,
  generateMarketingCampaignIntelligence,
  marketingCampaignIntelligenceScoring,
} from "./scoring/marketing-campaign-intelligence-scoring.js";
export type {
  CampaignIntelligenceBrandInput,
  CampaignIntelligenceOfferInput,
  MarketingCampaignIntelligenceInput,
  MarketingCampaignIntelligenceBreakdown,
} from "./scoring/marketing-campaign-intelligence-scoring.js";

export {
  MarketingCampaignIntelligenceEngine,
  defaultMarketingCampaignIntelligenceEngine,
} from "./engines/marketing-campaign-intelligence-engine.js";

export {
  MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_ID,
  MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_VERSION,
  MARKETING_CAMPAIGN_INTELLIGENCE_CAPABILITIES,
  MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_CONTRACT,
  MarketingCampaignIntelligenceModule,
  createMarketingCampaignIntelligenceModule,
  marketingCampaignIntelligenceModule,
} from "./contract/marketing-campaign-intelligence-module.js";
export type {
  MarketingCampaignIntelligenceModuleId,
  MarketingCampaignIntelligenceCapability,
  MarketingCampaignIntelligenceModuleContract,
} from "./contract/marketing-campaign-intelligence-module.js";
