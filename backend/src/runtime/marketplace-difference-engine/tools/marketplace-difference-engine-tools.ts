import type { RegisteredTool } from "../../../brain/types.js";
import { buildMarketplaceDifferenceEngine } from "../services/marketplace-difference-engine-service.js";

export const marketplaceDifferenceEngineTools: RegisteredTool[] = [{
  name: "marketplace_difference_engine.dashboard",
  description: "REAL-073 marketplace-difference-engine dashboard",
  module: "marketplace-difference-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildMarketplaceDifferenceEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
