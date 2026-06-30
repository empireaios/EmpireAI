import type { RegisteredTool } from "../../../brain/types.js";
import { buildCommandCenterPolish } from "../services/command-center-polish-service.js";

export const commandCenterPolishTools: RegisteredTool[] = [{
  name: "command_center_polish.dashboard",
  description: "REAL-091 command-center-polish dashboard",
  module: "command-center-polish",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCommandCenterPolish(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
