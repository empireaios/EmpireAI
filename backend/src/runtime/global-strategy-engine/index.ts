export { globalStrategyEngineDashboardSchema, MILESTONE_TARGETS } from "./models/global-strategy-engine.js";
export type { GlobalStrategyEngineDashboard } from "./models/global-strategy-engine.js";
export { buildGlobalStrategyEngine } from "./services/global-strategy-engine-service.js";
export { registerGlobalStrategyEngineRoutes } from "./routes/global-strategy-engine-routes.js";
export { globalStrategyEngineTools } from "./tools/global-strategy-engine-tools.js";
export const GLOBAL_STRATEGY_ENGINE_MODULE_ID = "global-strategy-engine" as const;
export const GLOBAL_STRATEGY_ENGINE_MISSION_ID = "REAL-034" as const;
