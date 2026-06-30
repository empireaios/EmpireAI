export { shippingIntelligenceSchema } from "./models/shipping-intelligence.js";
export type { ShippingIntelligence } from "./models/shipping-intelligence.js";
export { buildShippingIntelligence } from "./services/shipping-intelligence-service.js";
export { registerShippingIntelligenceRoutes } from "./routes/shipping-intelligence-routes.js";
export { shippingIntelligenceTools } from "./tools/shipping-intelligence-tools.js";
export const SHIPPING_INTELLIGENCE_MODULE_ID = "shipping-intelligence" as const;
export const SHIPPING_INTELLIGENCE_MISSION_ID = "REAL-076" as const;
