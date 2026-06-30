export { competitorIntelligenceDashboardSchema, competitorProfileSchema } from "./models/competitor-intelligence.js";
export type { CompetitorIntelligenceDashboard, CompetitorProfile } from "./models/competitor-intelligence.js";
export { buildCompetitorIntelligence } from "./services/competitor-intelligence-service.js";
export { registerCompetitorIntelligenceRoutes } from "./routes/competitor-intelligence-routes.js";
export { competitorIntelligenceTools } from "./tools/competitor-intelligence-tools.js";
export const COMPETITOR_INTELLIGENCE_MODULE_ID = "competitor-intelligence" as const;
export const COMPETITOR_INTELLIGENCE_MISSION_ID = "REAL-027" as const;
