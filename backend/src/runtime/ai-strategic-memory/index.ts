export { aiStrategicMemorySchema } from "./models/ai-strategic-memory.js";
export type { AiStrategicMemory } from "./models/ai-strategic-memory.js";
export { buildAiStrategicMemory } from "./services/ai-strategic-memory-service.js";
export { registerAiStrategicMemoryRoutes } from "./routes/ai-strategic-memory-routes.js";
export { aiStrategicMemoryTools } from "./tools/ai-strategic-memory-tools.js";
export const AI_STRATEGIC_MEMORY_MODULE_ID = "ai-strategic-memory" as const;
export const AI_STRATEGIC_MEMORY_MISSION_ID = "REAL-043" as const;
