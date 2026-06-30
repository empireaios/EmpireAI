export { customerPsychologyEngineDashboardSchema, productPsychologySchema } from "./models/customer-psychology-engine.js";
export type { CustomerPsychologyEngineDashboard, ProductPsychology } from "./models/customer-psychology-engine.js";
export { buildCustomerPsychologyEngine } from "./services/customer-psychology-engine-service.js";
export { registerCustomerPsychologyEngineRoutes } from "./routes/customer-psychology-engine-routes.js";
export { customerPsychologyEngineTools } from "./tools/customer-psychology-engine-tools.js";
export const CUSTOMER_PSYCHOLOGY_ENGINE_MODULE_ID = "customer-psychology-engine" as const;
export const CUSTOMER_PSYCHOLOGY_ENGINE_MISSION_ID = "REAL-028" as const;
