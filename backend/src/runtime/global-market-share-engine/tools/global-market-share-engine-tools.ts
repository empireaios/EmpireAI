import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalMarketShareEngine } from "../services/global-market-share-engine-service.js";

export const globalMarketShareEngineTools: RegisteredTool[] = [{
  name: "global_market_share_engine.dashboard",
  description: "REAL-053 Global market share engine dashboard",
  module: "global-market-share-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalMarketShareEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
