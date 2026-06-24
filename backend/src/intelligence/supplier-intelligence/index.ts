export {
  supplierCapabilitySchema,
  validateSupplierCapability,
  evaluateSupplierCapability,
} from "./models/supplier-capability.js";
export type { SupplierCapability, SupplierCapabilityInput } from "./models/supplier-capability.js";

export {
  SUPPLIER_RISK_LEVELS,
  supplierRiskProfileSchema,
  validateSupplierRiskProfile,
  resolveSupplierRiskLevel,
} from "./models/supplier-risk-profile.js";
export type { SupplierRiskProfile, SupplierRiskLevel } from "./models/supplier-risk-profile.js";

export {
  supplierProfileSchema,
  validateSupplierProfile,
} from "./models/supplier-profile.js";
export type {
  SupplierProfile,
  SupplierProfileId,
  SupplierProfileCreateInput,
  SupplierProfileUpdateInput,
} from "./models/supplier-profile.js";

export type { SupplierListQuery, SupplierRepository } from "./repositories/supplier-repository.js";

export {
  InMemorySupplierRepository,
  createInMemorySupplierRepository,
} from "./repositories/in-memory-supplier-repository.js";

export {
  SUPPLIER_SCORE_WEIGHTS,
  scoreSupplierProfile,
  evaluateRequiredCapabilities,
  supplierScoring,
} from "./scoring/supplier-scoring.js";
export type { SupplierScoreBreakdown } from "./scoring/supplier-scoring.js";

export {
  SUPPLIER_INTELLIGENCE_MODULE_ID,
  SUPPLIER_INTELLIGENCE_MODULE_VERSION,
  SUPPLIER_INTELLIGENCE_CAPABILITIES,
  SUPPLIER_INTELLIGENCE_MODULE_CONTRACT,
  SupplierIntelligenceModule,
  createSupplierIntelligenceModule,
  supplierIntelligenceModule,
} from "./contract/supplier-intelligence-module.js";
export type {
  SupplierIntelligenceModuleId,
  SupplierIntelligenceCapability,
  SupplierIntelligenceModuleContract,
} from "./contract/supplier-intelligence-module.js";
