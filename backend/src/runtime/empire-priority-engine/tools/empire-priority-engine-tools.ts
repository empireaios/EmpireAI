import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpirePriorityEngine } from "../services/empire-priority-engine-service.js";

export const empirePriorityEngineTools: RegisteredTool[] = [{
  name: "empire_priority_engine.dashboard",
  description: "REAL-090 empire-priority-engine dashboard",
  module: "empire-priority-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpirePriorityEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
