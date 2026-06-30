export {
  productDiscoveryInputSchema,
  normalizeProductDiscoveryInput,
  marketplaceRecommendationSchema,
  supplierAvailabilitySchema,
  productOpportunitySchema,
  DISCOVERY_SESSION_STAGES,
  discoverySessionSchema,
  discoveryDashboardSchema,
} from "./models/product-opportunity.js";
export type {
  ProductDiscoveryInput,
  MarketplaceRecommendation,
  SupplierAvailability,
  ProductOpportunity,
  DiscoverySessionStage,
  DiscoverySession,
  DiscoveryDashboard,
} from "./models/product-opportunity.js";

export { recommendMarketplaces, computeMarketplaceSuitability } from "./services/marketplace-recommendation-service.js";
export { enrichOpportunity, opportunitiesFromRecommendations } from "./services/opportunity-enrichment-service.js";
export { discoverProductOpportunities } from "./services/product-discovery-pipeline-service.js";

export {
  SqliteProductDiscoveryRepository,
  getProductDiscoveryRepository,
  resetProductDiscoveryRepository,
  ProductDiscoverySessionNotFoundError,
  ProductDiscoverySessionBlockedError,
  startProductDiscoverySession,
  runProductDiscovery,
  approveProductOpportunities,
  getDiscoverySession,
  listDiscoverySessions,
  buildDiscoveryDashboard,
  discoverOpportunitiesForInput,
} from "./services/discovery-workflow-service.js";

export { registerProductDiscoveryRoutes } from "./routes/product-discovery-routes.js";
export { productDiscoveryTools } from "./tools/product-discovery-tools.js";

export {
  PRODUCT_DISCOVERY_MODULE_ID,
  PRODUCT_DISCOVERY_CAPABILITIES,
  createProductDiscoveryModuleContract,
} from "./contract/product-discovery-module.js";
export type { ProductDiscoveryCapability } from "./contract/product-discovery-module.js";
