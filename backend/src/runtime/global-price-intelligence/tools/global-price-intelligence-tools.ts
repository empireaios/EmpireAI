import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalPriceIntelligence } from "../services/global-price-intelligence-service.js";

export const globalPriceIntelligenceTools: RegisteredTool[] = [{
  name: "global_price_intelligence.dashboard",
  description: "REAL-075 global-price-intelligence dashboard",
  module: "global-price-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalPriceIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
