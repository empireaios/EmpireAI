import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalStrategyEngine } from "../services/global-strategy-engine-service.js";

export const globalStrategyEngineTools: RegisteredTool[] = [{
  name: "global_strategy_engine.dashboard",
  description: "REAL-034 Global strategy engine dashboard",
  module: "global-strategy-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalStrategyEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
