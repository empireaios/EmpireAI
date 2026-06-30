import type { RegisteredTool } from "../../../brain/types.js";
import { buildAiSelfImprovementEngine } from "../services/ai-self-improvement-engine-service.js";

export const aiSelfImprovementEngineTools: RegisteredTool[] = [{
  name: "ai_self_improvement_engine.dashboard",
  description: "REAL-022 AI self-improvement recommendations (no self-modify)",
  module: "ai-self-improvement-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAiSelfImprovementEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
