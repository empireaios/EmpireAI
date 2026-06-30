export { aiSelfImprovementEngineSchema, IMPROVEMENT_CATEGORIES } from "./models/ai-self-improvement-engine.js";
export type { AiSelfImprovementEngine } from "./models/ai-self-improvement-engine.js";
export { buildAiSelfImprovementEngine } from "./services/ai-self-improvement-engine-service.js";
export { registerAiSelfImprovementEngineRoutes } from "./routes/ai-self-improvement-engine-routes.js";
export { aiSelfImprovementEngineTools } from "./tools/ai-self-improvement-engine-tools.js";
export const AI_SELF_IMPROVEMENT_ENGINE_MODULE_ID = "ai-self-improvement-engine" as const;
export const AI_SELF_IMPROVEMENT_ENGINE_MISSION_ID = "REAL-022" as const;
