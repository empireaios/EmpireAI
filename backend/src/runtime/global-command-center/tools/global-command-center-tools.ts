import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalCommandCenter } from "../services/global-command-center-service.js";

export const globalCommandCenterTools: RegisteredTool[] = [
  {
    name: "global_command_center.dashboard",
    description: "REAL-018 Mission Home operational HQ — aggregates live commerce intelligence",
    module: "global-command-center",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGlobalCommandCenter(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
