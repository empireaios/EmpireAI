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
  G3_01_SCHEMA_VERSION,
  G3_01_V1_SOURCES,
  G3_01_CAPABILITIES,
  G3_01_ENGINE_INTEGRATIONS,
  buildProductIntelligenceEngineArchitecture,
  loadProductIntelligenceEngineView,
  mapCatalogToAnalysisContract,
  rankAnalysisContracts,
  type ProductIntelligenceAnalysisContract,
  type ProductIntelligenceEngineArchitecture,
  type ProductIntelligenceEngineView,
} from "./engine-architecture.js";
export { productIntelligenceEngineModule } from "./module-contract.js";
export {
  PIE_MOCK_EVALUATIONS,
  buildMockEvaluationInput,
  listMockEvaluationCatalog,
} from "./mock-samples.js";
