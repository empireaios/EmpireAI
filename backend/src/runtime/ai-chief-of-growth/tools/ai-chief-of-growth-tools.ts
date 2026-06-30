import type { RegisteredTool } from "../../../brain/types.js";
import { buildAiChiefOfGrowth } from "../services/ai-chief-of-growth-service.js";

export const aiChiefOfGrowthTools: RegisteredTool[] = [{
  name: "ai_chief_of_growth.dashboard",
  description: "REAL-032 AI Chief of Growth dashboard",
  module: "ai-chief-of-growth",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAiChiefOfGrowth(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
