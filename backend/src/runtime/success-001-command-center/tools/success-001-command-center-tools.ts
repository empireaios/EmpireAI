import type { RegisteredTool } from "../../../brain/types.js";
import { buildSuccess001CommandCenter } from "../services/success-001-command-center-service.js";

export const success001CommandCenterTools: RegisteredTool[] = [{
  name: "success_001_command_center.dashboard",
  description: "REAL-035 SUCCESS-001 Command Center dashboard",
  module: "success-001-command-center",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildSuccess001CommandCenter(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
