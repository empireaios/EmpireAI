export {
  PRODUCT_LIFECYCLE_LABELS,
  liveProductMetricsSchema,
  liveProductRecordSchema,
  liveProductIntelligenceDashboardSchema,
} from "./models/live-product-intelligence.js";

export type {
  ProductLifecycleLabel,
  LiveProductRecord,
  LiveProductIntelligenceDashboard,
} from "./models/live-product-intelligence.js";

export { buildLiveProductIntelligence } from "./services/live-product-intelligence-service.js";
export { registerLiveProductIntelligenceRoutes } from "./routes/live-product-intelligence-routes.js";
export { liveProductIntelligenceTools } from "./tools/live-product-intelligence-tools.js";

export const LIVE_PRODUCT_INTELLIGENCE_MODULE_ID = "live-product-intelligence" as const;
export const LIVE_PRODUCT_INTELLIGENCE_MISSION_ID = "REAL-013" as const;
