export { globalAdvertisingIntelligenceSchema, AD_PLATFORMS } from "./models/global-advertising-intelligence.js";
export type { GlobalAdvertisingIntelligence, AdPlatform } from "./models/global-advertising-intelligence.js";
export { buildGlobalAdvertisingIntelligence } from "./services/global-advertising-intelligence-service.js";
export { registerGlobalAdvertisingIntelligenceRoutes } from "./routes/global-advertising-intelligence-routes.js";
export { globalAdvertisingIntelligenceTools } from "./tools/global-advertising-intelligence-tools.js";
export const GLOBAL_ADVERTISING_INTELLIGENCE_MODULE_ID = "global-advertising-intelligence" as const;
export const GLOBAL_ADVERTISING_INTELLIGENCE_MISSION_ID = "REAL-038" as const;
