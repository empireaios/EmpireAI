import type { RegisteredTool } from "../../../brain/types.js";
import { buildExecutiveProductOptimization } from "../services/executive-product-optimization-service.js";

export const executiveProductOptimizationTools: RegisteredTool[] = [
  {
    name: "executive_product_optimization.dashboard",
    description: "REAL-014 executive product optimization recommendations (debate only)",
    module: "executive-product-optimization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildExecutiveProductOptimization(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
