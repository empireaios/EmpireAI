import type { RegisteredTool } from "../../../brain/types.js";
import { buildAiStrategicMemory } from "../services/ai-strategic-memory-service.js";

export const aiStrategicMemoryTools: RegisteredTool[] = [{
  name: "ai_strategic_memory.dashboard",
  description: "REAL-043 AI strategic memory dashboard (wraps strategic-memory-engine)",
  module: "ai-strategic-memory",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAiStrategicMemory(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
