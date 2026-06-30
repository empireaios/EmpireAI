import type { RegisteredTool } from "../../../brain/types.js";
import { buildSupplierIntelligenceLoop } from "../services/supplier-intelligence-loop-service.js";

export const supplierIntelligenceLoopTools: RegisteredTool[] = [
  {
    name: "supplier_intelligence_loop.dashboard",
    description: "REAL-015 continuous supplier intelligence loop",
    module: "supplier-intelligence-loop",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildSupplierIntelligenceLoop(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
