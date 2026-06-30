import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalMarketplaceAdapterFramework } from "../services/global-marketplace-adapter-framework-service.js";

export const globalMarketplaceAdapterFrameworkTools: RegisteredTool[] = [{
  name: "global_marketplace_adapter_framework.dashboard",
  description: "REAL-072 global-marketplace-adapter-framework dashboard",
  module: "global-marketplace-adapter-framework",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalMarketplaceAdapterFramework(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
