export {
  SUPPLIER_PROVIDER_IDS,
  SUPPLIER_PROVIDER_CATALOG,
  SUPPLIER_ADAPTER_STATUSES,
  getSupplierProvider,
} from "./models/supplier-abstraction.js";

export type { SupplierProviderId, SupplierAdapterRecord, SupplierProviderDefinition } from "./models/supplier-abstraction.js";

export {
  supplierProductSchema,
  SUPPLIER_PRODUCT_TRACKED_FIELDS,
} from "./models/supplier-product.js";

export type { SupplierProduct, SupplierProductVariant } from "./models/supplier-product.js";

export {
  SUPPLIER_SCORE_DIMENSIONS,
  SUPPLIER_SCORE_WEIGHTS,
  supplierScoreResultSchema,
} from "./models/supplier-scoring.js";

export type { SupplierScoreResult, SupplierScoreDimension } from "./models/supplier-scoring.js";

export {
  shippingAcceptabilityInputSchema,
  shippingAcceptabilityResultSchema,
} from "./models/shipping-acceptability.js";

export type { ShippingAcceptabilityInput, ShippingAcceptabilityResult } from "./models/shipping-acceptability.js";

export { supplierComparisonResultSchema } from "./models/supplier-comparison.js";
export type { SupplierComparisonResult } from "./models/supplier-comparison.js";

export { SUPPLIER_RISK_TYPES, supplierRiskSignalSchema } from "./models/supplier-risk.js";
export type { SupplierRiskSignal, SupplierRiskType } from "./models/supplier-risk.js";

export { supplierOpportunitySchema } from "./models/supplier-opportunity.js";
export type { SupplierOpportunity } from "./models/supplier-opportunity.js";

export { supplierDashboardSchema } from "./models/supplier-dashboard.js";
export type { SupplierDashboard } from "./models/supplier-dashboard.js";

export { fulfillmentHandoffSchema, FULFILLMENT_HANDOFF_STAGES } from "./models/fulfillment-handoff.js";
export type { FulfillmentHandoff } from "./models/fulfillment-handoff.js";

export {
  CJ_ADAPTER_OPERATIONS,
  CJ_ADAPTER_OPERATION_MAP,
  buildCjAdapterSkeleton,
} from "./adapters/cj-dropshipping-adapter.js";

export { buildSupplierAdapterRegistry, getSupplierAdapter } from "./services/supplier-adapter-registry-service.js";
export { scoreSupplierProduct } from "./services/supplier-scoring-service.js";
export { evaluateShippingAcceptability } from "./services/shipping-acceptability-service.js";
export { compareSuppliersForProduct } from "./services/supplier-comparison-service.js";
export { detectSupplierRisks } from "./services/supplier-risk-service.js";
export {
  findSupplierOpportunities,
  listSupplierProducts,
  ingestSupplierProduct,
  resetSupplierIntelligenceProducts,
} from "./services/supplier-opportunity-service.js";
export { pushSupplierProductToCis, syncOpportunitiesToCis } from "./services/cis-pipeline-service.js";
export { pushSupplierProductToGkr, syncApprovedOpportunitiesToGkr } from "./services/gkr-pipeline-service.js";
export { prepareFulfillmentHandoff, describeFulfillmentChain } from "./services/fulfillment-handoff-service.js";
export { buildSupplierDashboard } from "./services/supplier-dashboard-service.js";
export { buildExecutiveSupplierBriefing } from "./services/executive-supplier-briefing-service.js";
export { runSupplierWatcher } from "./services/supplier-surveyor-watcher.js";

export { registerSupplierIntelligenceRoutes } from "./routes/supplier-intelligence-routes.js";
export { supplierIntelligenceFoundationTools } from "./tools/supplier-intelligence-tools.js";

export const SUPPLIER_INTELLIGENCE_MODULE_ID = "supplier-intelligence" as const;
export const SUPPLIER_INTELLIGENCE_MISSION_IDS = [
  "SUP-001", "SUP-002", "SUP-003", "SUP-004", "SUP-005", "SUP-006", "SUP-007",
  "SUP-008", "SUP-009", "SUP-010", "SUP-011", "SUP-012", "SUP-013", "SUP-014", "SUP-015",
] as const;
