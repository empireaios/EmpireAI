export {
  createGlobalCommerceIntelligenceModuleContract,
  GLOBAL_COMMERCE_INTELLIGENCE_MODULE_ID,
} from "./contract/global-commerce-intelligence-module.js";

export { getCountryIntelligenceProfile, listCountryIntelligenceProfiles, registerCountryIntelligenceSeed, getSeedCountryCount } from "./services/country-intelligence-service.js";
export { buildCommerceEcosystemProfile, listCommerceEcosystemProfiles, listEcosystemDomainIds } from "./services/commerce-ecosystem-service.js";
export { computeExpansionIntelligenceScore, listExpansionIntelligenceScores } from "./services/expansion-intelligence-score-service.js";
export { rankGlobalOpportunities, getLatestOpportunityRanking } from "./services/opportunity-ranking-service.js";
export { buildGlobalCommerceIntelligenceDashboard, buildEsisGlobalCommerceIntelligencePayload } from "./services/global-commerce-intelligence-dashboard-service.js";

export { registerGlobalCommerceIntelligenceRoutes } from "./routes/global-commerce-intelligence-routes.js";
export { globalCommerceIntelligenceTools } from "./tools/global-commerce-intelligence-tools.js";
export { resetGlobalCommerceIntelligenceRepository } from "./repositories/sqlite-global-commerce-intelligence-repository.js";

export type { CountryIntelligenceProfile, CountryIntelligenceDimensions } from "./models/country-intelligence.js";
export type { CommerceEcosystemProfile } from "./models/commerce-ecosystem.js";
export type { ExpansionIntelligenceScore } from "./models/expansion-intelligence-score.js";
export type { OpportunityRankingResult, OpportunityRankingInput } from "./models/opportunity-ranking.js";
export type { GlobalCommerceIntelligenceDashboard } from "./models/intelligence-dashboard.js";
