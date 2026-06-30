export {
  MARKETING_PLATFORMS,
  marketingPlatformSchema,
  validateMarketingPlatform,
  marketingPlatformLabel,
} from "./models/marketing-platform.js";
export type { MarketingPlatform } from "./models/marketing-platform.js";

export { adAngleSchema, validateAdAngle } from "./models/ad-angle.js";
export type { AdAngle } from "./models/ad-angle.js";

export { creativeIdeaSchema, validateCreativeIdea } from "./models/creative-idea.js";
export type { CreativeIdea } from "./models/creative-idea.js";

export {
  platformRecommendationSchema,
  validatePlatformRecommendation,
} from "./models/platform-recommendation.js";
export type { PlatformRecommendation } from "./models/platform-recommendation.js";

export {
  CAMPAIGN_GENESIS_SIGNAL_TYPES,
  campaignGenesisSignalSchema,
  validateCampaignGenesisSignal,
} from "./models/campaign-genesis-signal.js";
export type {
  CampaignGenesisSignalType,
  CampaignGenesisSignal,
} from "./models/campaign-genesis-signal.js";

export {
  marketingCampaignSchema,
  validateMarketingCampaign,
} from "./models/marketing-campaign.js";
export type {
  MarketingCampaignId,
  MarketingCampaign,
  MarketingCampaignCreateInput,
} from "./models/marketing-campaign.js";

export {
  campaignGenesisRecordSchema,
  validateCampaignGenesisRecord,
} from "./models/campaign-genesis-record.js";
export type {
  CampaignGenesisRecordId,
  CampaignGenesisRecord,
  CampaignGenesisRecordCreateInput,
} from "./models/campaign-genesis-record.js";

export type {
  CampaignGenesisRepositoryQuery,
  CampaignGenesisRepository,
} from "./repositories/campaign-genesis-repository.js";

export {
  InMemoryCampaignGenesisRepository,
  createInMemoryCampaignGenesisRepository,
} from "./repositories/in-memory-campaign-genesis-repository.js";

export {
  CAMPAIGN_GENESIS_SIGNAL_WEIGHTS,
  generateMarketingCampaign,
  marketingCampaignGenesisScoring,
} from "./scoring/marketing-campaign-genesis-scoring.js";
export type {
  CampaignGenesisBrandInput,
  CampaignGenesisOfferInput,
  MarketingCampaignGenesisInput,
  MarketingCampaignGenesisBreakdown,
} from "./scoring/marketing-campaign-genesis-scoring.js";

export {
  MarketingCampaignGenesisEngine,
  defaultMarketingCampaignGenesisEngine,
} from "./engines/marketing-campaign-genesis-engine.js";

export {
  MARKETING_CAMPAIGN_GENESIS_MODULE_ID,
  MARKETING_CAMPAIGN_GENESIS_MODULE_VERSION,
  MARKETING_CAMPAIGN_GENESIS_CAPABILITIES,
  MARKETING_CAMPAIGN_GENESIS_MODULE_CONTRACT,
  MarketingCampaignGenesisModule,
  createMarketingCampaignGenesisModule,
  marketingCampaignGenesisModule,
} from "./contract/marketing-campaign-genesis-module.js";
export type {
  MarketingCampaignGenesisModuleId,
  MarketingCampaignGenesisCapability,
  MarketingCampaignGenesisModuleContract,
} from "./contract/marketing-campaign-genesis-module.js";
