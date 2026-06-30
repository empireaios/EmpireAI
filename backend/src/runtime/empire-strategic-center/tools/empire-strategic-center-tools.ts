import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireStrategicCenter } from "../services/empire-strategic-center-service.js";

export const empireStrategicCenterTools: RegisteredTool[] = [{
  name: "empire_strategic_center.dashboard",
  description: "REAL-067 Empire strategic center dashboard",
  module: "empire-strategic-center",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireStrategicCenter(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
