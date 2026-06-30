import type { RegisteredTool } from "../../../brain/types.js";
import { buildPostLaunchCommander } from "../services/post-launch-commander-service.js";

export const postLaunchCommanderTools: RegisteredTool[] = [{
  name: "post_launch_commander.dashboard",
  description: "REAL-078 post-launch-commander dashboard",
  module: "post-launch-commander",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildPostLaunchCommander(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
