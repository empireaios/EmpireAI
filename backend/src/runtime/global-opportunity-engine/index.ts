export {
  globalOpportunitySchema,
  globalOpportunityEngineSchema,
} from "./models/global-opportunity-engine.js";

export type { GlobalOpportunityEngine } from "./models/global-opportunity-engine.js";

export { buildGlobalOpportunityEngine } from "./services/global-opportunity-engine-service.js";
export { registerGlobalOpportunityEngineRoutes } from "./routes/global-opportunity-engine-routes.js";
export { globalOpportunityEngineTools } from "./tools/global-opportunity-engine-tools.js";

export const GLOBAL_OPPORTUNITY_ENGINE_MODULE_ID = "global-opportunity-engine" as const;
export const GLOBAL_OPPORTUNITY_ENGINE_MISSION_ID = "REAL-016" as const;
