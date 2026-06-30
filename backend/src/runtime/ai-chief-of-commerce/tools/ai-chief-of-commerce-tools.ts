import type { RegisteredTool } from "../../../brain/types.js";
import { buildAiChiefOfCommerce } from "../services/ai-chief-of-commerce-service.js";

export const aiChiefOfCommerceTools: RegisteredTool[] = [{
  name: "ai_chief_of_commerce.dashboard",
  description: "REAL-031 AI Chief of Commerce dashboard",
  module: "ai-chief-of-commerce",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildAiChiefOfCommerce(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
