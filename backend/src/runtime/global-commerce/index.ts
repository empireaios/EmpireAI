export {
  createGlobalCommerceModuleContract,
  GLOBAL_COMMERCE_MODULE_ID,
} from "./contract/global-commerce-module.js";

export { buildGlobalCommerceRegistry, getCountry, getMarketplacesByCountry, listRuntimePluginCoverage } from "./services/global-commerce-registry-service.js";
export { buildOrLoadGlobalCommerceIdentity, getGlobalCommerceIdentity, summarizeIdentityFootprint } from "./services/global-commerce-identity-service.js";
export { computeOnboardingReadiness, computeCountryOnboardingBatch } from "./services/onboarding-readiness-service.js";
export { createGlobalExpansionPlan, getLatestExpansionPlan } from "./services/global-expansion-planner-service.js";
export { buildGlobalCommerceDashboard, buildEsisGlobalCommercePayload } from "./services/global-commerce-dashboard-service.js";

export { registerGlobalCommerceRoutes } from "./routes/global-commerce-routes.js";
export { globalCommerceTools } from "./tools/global-commerce-tools.js";
export { resetGlobalCommerceRepository } from "./repositories/sqlite-global-commerce-repository.js";

export type { GlobalCommerceRegistrySnapshot, Country, ProviderEntry } from "./models/global-registry.js";
export type { GlobalCommerceIdentity } from "./models/global-identity.js";
export type { OnboardingReadiness } from "./models/onboarding-readiness.js";
export type { GlobalExpansionPlan } from "./models/expansion-plan.js";
