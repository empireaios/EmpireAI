export { kingDecisionHistorySchema } from "./models/king-decision-history.js";
export type { KingDecisionHistory } from "./models/king-decision-history.js";
export { buildKingDecisionHistory } from "./services/king-decision-history-service.js";
export { registerKingDecisionHistoryRoutes } from "./routes/king-decision-history-routes.js";
export { kingDecisionHistoryTools } from "./tools/king-decision-history-tools.js";
export const KING_DECISION_HISTORY_MODULE_ID = "king-decision-history" as const;
export const KING_DECISION_HISTORY_MISSION_ID = "REAL-086" as const;
