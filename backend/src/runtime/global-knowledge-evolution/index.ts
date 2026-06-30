export { globalKnowledgeEvolutionSchema, KNOWLEDGE_LEARNING_SOURCES } from "./models/global-knowledge-evolution.js";
export type { GlobalKnowledgeEvolution, KnowledgeLearningSource } from "./models/global-knowledge-evolution.js";
export { buildGlobalKnowledgeEvolution } from "./services/global-knowledge-evolution-service.js";
export { registerGlobalKnowledgeEvolutionRoutes } from "./routes/global-knowledge-evolution-routes.js";
export { globalKnowledgeEvolutionTools } from "./tools/global-knowledge-evolution-tools.js";
export const GLOBAL_KNOWLEDGE_EVOLUTION_MODULE_ID = "global-knowledge-evolution" as const;
export const GLOBAL_KNOWLEDGE_EVOLUTION_MISSION_ID = "REAL-042" as const;
