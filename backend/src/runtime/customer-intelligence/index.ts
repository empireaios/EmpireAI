export { customerIntelligenceDashboardSchema, customerProfileSchema } from "./models/customer-intelligence.js";
export type { CustomerIntelligenceDashboard, CustomerProfile } from "./models/customer-intelligence.js";
export { buildCustomerIntelligence } from "./services/customer-intelligence-service.js";
export { registerCustomerIntelligenceRoutes } from "./routes/customer-intelligence-routes.js";
export { customerIntelligenceTools } from "./tools/customer-intelligence-tools.js";
export const CUSTOMER_INTELLIGENCE_MODULE_ID = "customer-intelligence" as const;
export const CUSTOMER_INTELLIGENCE_MISSION_ID = "REAL-026" as const;
