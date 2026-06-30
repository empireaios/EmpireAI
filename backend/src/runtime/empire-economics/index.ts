export { empireEconomicsDashboardSchema, costLineItemSchema, COST_CATEGORIES } from "./models/empire-economics.js";
export type { EmpireEconomicsDashboard, CostLineItem } from "./models/empire-economics.js";
export { buildEmpireEconomics } from "./services/empire-economics-service.js";
export { registerEmpireEconomicsRoutes } from "./routes/empire-economics-routes.js";
export { empireEconomicsTools } from "./tools/empire-economics-tools.js";
export const EMPIRE_ECONOMICS_MODULE_ID = "empire-economics" as const;
export const EMPIRE_ECONOMICS_MISSION_ID = "REAL-019" as const;
