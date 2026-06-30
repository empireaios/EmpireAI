export {
  GRAND_KING_LAUNCH_RECOMMENDATIONS,
  STRATEGY_MARKETPLACES,
  strategyIdentitySchema,
  battlefieldAnalysisSchema,
  competitiveAdvantageSchema,
  customerPsychologySchema,
  pricingStrategySchema,
  marketplaceStrategyEntrySchema,
  brandGrowthRoadmapSchema,
  riskAssessmentSchema,
  grandKingRecommendationSchema,
  marketDominationStrategyDocumentSchema,
  marketStrategyComparisonSchema,
  marketStrategyDashboardSchema,
  marketStrategySummarySchema,
} from "./models/market-domination-strategy.js";
export type {
  GrandKingLaunchRecommendation,
  StrategyMarketplaceId,
  StrategyIdentity,
  BattlefieldAnalysis,
  CompetitiveAdvantage,
  CustomerPsychology,
  PricingStrategy,
  MarketplaceStrategyEntry,
  BrandGrowthRoadmap,
  RiskAssessment,
  GrandKingRecommendation,
  MarketDominationStrategyDocument,
  MarketStrategyComparison,
  MarketStrategyDashboard,
  MarketStrategySummary,
} from "./models/market-domination-strategy.js";

export { generateMarketDominationStrategy } from "./services/market-strategy-generator.js";

export {
  SqliteMarketStrategyRepository,
  getMarketStrategyRepository,
  resetMarketStrategyRepository,
} from "./repositories/sqlite-market-strategy-repository.js";

export {
  MarketStrategyNotFoundError,
  MarketStrategyBlockedError,
  generateMarketStrategyForOpportunity,
  listMarketStrategies,
  getMarketStrategy,
  compareMarketStrategies,
  buildMarketStrategySummary,
  buildMarketStrategyDashboard,
} from "./services/market-domination-strategy-service.js";

export { registerMarketDominationStrategyRoutes } from "./routes/market-domination-strategy-routes.js";
export { marketDominationStrategyTools } from "./tools/market-domination-strategy-tools.js";

export {
  MARKET_DOMINATION_STRATEGY_MODULE_ID,
  MARKET_DOMINATION_STRATEGY_CAPABILITIES,
  createMarketDominationStrategyModuleContract,
} from "./contract/market-domination-strategy-module.js";
export type { MarketDominationStrategyCapability } from "./contract/market-domination-strategy-module.js";
