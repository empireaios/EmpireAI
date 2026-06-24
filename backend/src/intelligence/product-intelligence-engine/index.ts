export * from "./types.js";
export * from "./score-computers.js";
export * from "./recommendation-engine.js";
export {
  evaluateProduct,
  productIntelligenceEvaluationEngine,
  ProductIntelligenceEvaluationEngine,
} from "./product-intelligence-engine.js";
export {
  productIntelligenceCatalogRepository,
  ProductIntelligenceCatalogRepository,
  type ProductIntelligenceCatalogRecord,
} from "./catalog-repository.js";
export {
  productIntelligenceService,
  ProductIntelligenceService,
  formatDemandLabel,
  formatMarginPct,
  formatTrendLabel,
  formatRecommendationLabel,
  formatSupplierAvailability,
} from "./service.js";
export { registerProductIntelligenceRoutes } from "./routes.js";
export {
  PIE_MOCK_EVALUATIONS,
  buildMockEvaluationInput,
  listMockEvaluationCatalog,
} from "./mock-samples.js";
