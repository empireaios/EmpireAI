export {
  VISUAL_DEBATE_CHIEF_IDS,
  CHIEF_TITLES,
  chiefCardSchema,
  soulRecommendationSchema,
  grandKingDecisionSchema,
  executiveVisualDebateSchema,
} from "./models/executive-visual-debate.js";

export type { ExecutiveVisualDebate, ChiefCard } from "./models/executive-visual-debate.js";

export {
  buildExecutiveVisualDebate,
  recordGrandKingDecision,
} from "./services/executive-visual-debate-service.js";

export { registerExecutiveVisualDebateRoutes } from "./routes/executive-visual-debate-routes.js";
export { executiveVisualDebateTools } from "./tools/executive-visual-debate-tools.js";

export const EXECUTIVE_VISUAL_DEBATE_MODULE_ID = "executive-visual-debate" as const;
export const EXECUTIVE_VISUAL_DEBATE_MISSION_IDS = ["REAL-007"] as const;
