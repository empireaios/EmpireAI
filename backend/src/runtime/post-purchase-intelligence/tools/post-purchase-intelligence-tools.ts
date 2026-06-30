import type { RegisteredTool } from "../../../brain/types.js";
import { buildPostPurchaseIntelligence } from "../services/post-purchase-intelligence-service.js";

export const postPurchaseIntelligenceTools: RegisteredTool[] = [{
  name: "post_purchase_intelligence.dashboard",
  description: "REAL-041 Post-purchase intelligence dashboard",
  module: "post-purchase-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildPostPurchaseIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
