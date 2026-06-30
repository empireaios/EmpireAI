import type { RegisteredTool } from "../../../brain/types.js";
import { buildLiveProductIntelligence } from "../services/live-product-intelligence-service.js";

export const liveProductIntelligenceTools: RegisteredTool[] = [
  {
    name: "live_product_intelligence.dashboard",
    description: "REAL-013 continuous live product evaluation dashboard",
    module: "live-product-intelligence",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildLiveProductIntelligence(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
