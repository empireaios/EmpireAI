import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalExpansionCommand } from "../services/global-expansion-command-service.js";

export const globalExpansionCommandTools: RegisteredTool[] = [{
  name: "global_expansion_command.dashboard",
  description: "REAL-065 Global expansion command dashboard",
  module: "global-expansion-command",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalExpansionCommand(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
