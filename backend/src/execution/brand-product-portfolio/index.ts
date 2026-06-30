export {
  BRAND_PRODUCT_SIGNAL_TYPES,
  brandProductSignalSchema,
  validateBrandProductSignal,
} from "./models/brand-product-signal.js";
export type { BrandProductSignalType, BrandProductSignal } from "./models/brand-product-signal.js";

export {
  BRAND_PRODUCT_ROLES,
  brandProductSchema,
  validateBrandProduct,
} from "./models/brand-product.js";
export type { BrandProductRole, BrandProduct } from "./models/brand-product.js";

export {
  brandProductPortfolioSchema,
  validateBrandProductPortfolio,
} from "./models/brand-product-portfolio.js";
export type {
  BrandProductPortfolioId,
  BrandProductPortfolio,
  BrandProductPortfolioCreateInput,
} from "./models/brand-product-portfolio.js";

export type {
  BrandProductRepositoryQuery,
  BrandProductRepository,
} from "./repositories/brand-product-repository.js";

export {
  InMemoryBrandProductRepository,
  createInMemoryBrandProductRepository,
} from "./repositories/in-memory-brand-product-repository.js";

export {
  BRAND_PRODUCT_SIGNAL_WEIGHTS,
  scoreBrandProductPortfolio,
  brandProductScoring,
} from "./scoring/brand-product-scoring.js";
export type {
  BrandProductBrandInput,
  BrandProductKnowledgeInput,
  BrandProductRelationshipInput,
  BrandProductOpportunityInput,
  BrandProductSupplierMatchInput,
  BrandProductPortfolioInput,
  BrandProductPortfolioBreakdown,
} from "./scoring/brand-product-scoring.js";

export {
  BrandProductPortfolioEngine,
  defaultBrandProductPortfolioEngine,
} from "./engines/brand-product-portfolio-engine.js";

export {
  BRAND_PRODUCT_PORTFOLIO_MODULE_ID,
  BRAND_PRODUCT_PORTFOLIO_MODULE_VERSION,
  BRAND_PRODUCT_PORTFOLIO_CAPABILITIES,
  BRAND_PRODUCT_PORTFOLIO_MODULE_CONTRACT,
  BrandProductPortfolioModule,
  createBrandProductPortfolioModule,
  brandProductPortfolioModule,
} from "./contract/brand-product-portfolio-module.js";
export type {
  BrandProductPortfolioModuleId,
  BrandProductPortfolioCapability,
  BrandProductPortfolioModuleContract,
} from "./contract/brand-product-portfolio-module.js";
