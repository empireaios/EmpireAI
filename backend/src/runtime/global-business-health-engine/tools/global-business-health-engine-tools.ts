import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalBusinessHealthEngine } from "../services/global-business-health-engine-service.js";

export const globalBusinessHealthEngineTools: RegisteredTool[] = [{
  name: "global_business_health_engine.dashboard",
  description: "REAL-061 Global business health engine dashboard",
  module: "global-business-health-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalBusinessHealthEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
