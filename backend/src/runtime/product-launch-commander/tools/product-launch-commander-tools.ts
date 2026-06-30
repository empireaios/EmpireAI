import type { RegisteredTool } from "../../../brain/types.js";
import { buildProductLaunchCommander } from "../services/product-launch-commander-service.js";

export const productLaunchCommanderTools: RegisteredTool[] = [{
  name: "product_launch_commander.dashboard",
  description: "REAL-077 product-launch-commander dashboard",
  module: "product-launch-commander",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildProductLaunchCommander(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
