import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalAdvertisingIntelligence } from "../services/global-advertising-intelligence-service.js";

export const globalAdvertisingIntelligenceTools: RegisteredTool[] = [{
  name: "global_advertising_intelligence.dashboard",
  description: "REAL-038 Global advertising intelligence dashboard (recommendations only)",
  module: "global-advertising-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalAdvertisingIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
