import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalOrderIntelligence } from "../services/global-order-intelligence-service.js";

export const globalOrderIntelligenceTools: RegisteredTool[] = [{
  name: "global_order_intelligence.dashboard",
  description: "REAL-040 Global order intelligence dashboard",
  module: "global-order-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalOrderIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
