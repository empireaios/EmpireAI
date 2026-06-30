export { productRetirementEngineSchema } from "./models/product-retirement-engine.js";
export type { ProductRetirementEngine } from "./models/product-retirement-engine.js";
export { buildProductRetirementEngine } from "./services/product-retirement-engine-service.js";
export { registerProductRetirementEngineRoutes } from "./routes/product-retirement-engine-routes.js";
export { productRetirementEngineTools } from "./tools/product-retirement-engine-tools.js";
export const PRODUCT_RETIREMENT_ENGINE_MODULE_ID = "product-retirement-engine" as const;
export const PRODUCT_RETIREMENT_ENGINE_MISSION_ID = "REAL-080" as const;
