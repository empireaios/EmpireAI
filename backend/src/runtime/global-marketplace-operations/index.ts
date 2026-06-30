export {
  DISTRIBUTION_STATUSES,
  CONNECTION_STATUSES,
  SUPPORTED_GLOBAL_MARKETPLACE_FAMILIES,
  countryMarketplaceProductSchema,
  countryMarketplaceSlotSchema,
  countryOperationsViewSchema,
  globalMarketplaceOperationsSchema,
} from "./models/country-marketplace-operations.js";

export type {
  DistributionStatus,
  ConnectionStatus,
  CountryMarketplaceProduct,
  CountryMarketplaceSlot,
  CountryOperationsView,
  GlobalMarketplaceOperations,
} from "./models/country-marketplace-operations.js";

export {
  DISTRIBUTION_CLASSIFICATIONS,
  distributionMarketplaceEntrySchema,
  globalDistributionPlanSchema,
  globalDistributionDebateSchema,
} from "./models/global-distribution-plan.js";

export type {
  DistributionClassification,
  GlobalDistributionPlan,
  GlobalDistributionDebate,
} from "./models/global-distribution-plan.js";

export {
  buildGlobalMarketplaceOperations,
  getCountryOperationsView,
} from "./services/country-marketplace-operations-service.js";

export {
  buildGlobalMarketplaceDistributionDashboard,
} from "./services/global-marketplace-distribution-dashboard-service.js";

export type { GlobalMarketplaceDistributionDashboard } from "./services/global-marketplace-distribution-dashboard-service.js";

export {
  buildGlobalDistributionPlan,
  resetGlobalDistributionPlans,
} from "./services/global-product-distribution-engine-service.js";

export {
  buildGlobalDistributionExecutiveDebate,
  recordGlobalDistributionKingDecision,
} from "./services/global-distribution-executive-debate-service.js";

export { registerGlobalMarketplaceOperationsRoutes } from "./routes/global-marketplace-operations-routes.js";
export { globalMarketplaceOperationsTools } from "./tools/global-marketplace-operations-tools.js";

export const GLOBAL_MARKETPLACE_OPERATIONS_MODULE_ID = "global-marketplace-operations" as const;
export const GLOBAL_MARKETPLACE_OPERATIONS_MISSION_IDS = [
  "REAL-008", "REAL-009", "REAL-010", "REAL-011", "REAL-012",
] as const;
