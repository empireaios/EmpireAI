export {
  brandIdentitySchema,
  validateBrandIdentity,
} from "./models/brand-identity.js";
export type { BrandIdentity } from "./models/brand-identity.js";

export {
  brandPositioningSchema,
  validateBrandPositioning,
} from "./models/brand-positioning.js";
export type { BrandPositioning } from "./models/brand-positioning.js";

export {
  brandProfileSchema,
  validateBrandProfile,
} from "./models/brand-profile.js";
export type {
  BrandProfileId,
  BrandProfile,
  BrandProfileCreateInput,
} from "./models/brand-profile.js";

export type {
  BrandRepositoryQuery,
  BrandRepository,
} from "./repositories/brand-repository.js";

export {
  InMemoryBrandRepository,
  createInMemoryBrandRepository,
} from "./repositories/in-memory-brand-repository.js";

export {
  scoreBrandGenesis,
  brandScoring,
} from "./scoring/brand-scoring.js";
export type {
  BrandGenesisRevenueOpportunityInput,
  BrandGenesisPortfolioEntryInput,
  BrandGenesisCapitalAllocationInput,
  BrandGenesisInput,
  BrandGenesisBreakdown,
  RevenueOpportunityType,
} from "./scoring/brand-scoring.js";

export {
  BrandGenesisEngine,
  defaultBrandGenesisEngine,
} from "./engines/brand-genesis-engine.js";

export {
  BRAND_GENESIS_MODULE_ID,
  BRAND_GENESIS_MODULE_VERSION,
  BRAND_GENESIS_CAPABILITIES,
  BRAND_GENESIS_MODULE_CONTRACT,
  BrandGenesisModule,
  createBrandGenesisModule,
  brandGenesisModule,
} from "./contract/brand-genesis-module.js";
export type {
  BrandGenesisModuleId,
  BrandGenesisCapability,
  BrandGenesisModuleContract,
} from "./contract/brand-genesis-module.js";
