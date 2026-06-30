import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalOperationalCommandCenter } from "../services/global-operational-command-center-service.js";

export const globalOperationalCommandCenterTools: RegisteredTool[] = [{
  name: "global_operational_command_center.dashboard",
  description: "REAL-037 Empire Headquarters global operational command center dashboard",
  module: "global-operational-command-center",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalOperationalCommandCenter(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
