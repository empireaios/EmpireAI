export { globalExpansionScoreSchema } from "./models/global-expansion-score.js";
export type { GlobalExpansionScore } from "./models/global-expansion-score.js";
export { buildGlobalExpansionScore } from "./services/global-expansion-score-service.js";
export { registerGlobalExpansionScoreRoutes } from "./routes/global-expansion-score-routes.js";
export { globalExpansionScoreTools } from "./tools/global-expansion-score-tools.js";
export const GLOBAL_EXPANSION_SCORE_MODULE_ID = "global-expansion-score" as const;
export const GLOBAL_EXPANSION_SCORE_MISSION_ID = "REAL-089" as const;
