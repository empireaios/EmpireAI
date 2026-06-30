export {
  OPTIMIZATION_ACTIONS,
  optimizationRecommendationSchema,
  executiveProductOptimizationSchema,
} from "./models/executive-product-optimization.js";

export type {
  OptimizationRecommendation,
  ExecutiveProductOptimization,
} from "./models/executive-product-optimization.js";

export { buildExecutiveProductOptimization } from "./services/executive-product-optimization-service.js";
export { registerExecutiveProductOptimizationRoutes } from "./routes/executive-product-optimization-routes.js";
export { executiveProductOptimizationTools } from "./tools/executive-product-optimization-tools.js";

export const EXECUTIVE_PRODUCT_OPTIMIZATION_MODULE_ID = "executive-product-optimization" as const;
export const EXECUTIVE_PRODUCT_OPTIMIZATION_MISSION_ID = "REAL-014" as const;
