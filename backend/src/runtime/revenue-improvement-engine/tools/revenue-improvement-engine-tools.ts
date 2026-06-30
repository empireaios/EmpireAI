import type { RegisteredTool } from "../../../brain/types.js";
import { buildRevenueImprovementEngine } from "../services/revenue-improvement-engine-service.js";

export const revenueImprovementEngineTools: RegisteredTool[] = [
  {
    name: "revenue_improvement_engine.dashboard",
    description: "REAL-017 aggregated revenue improvement proposals",
    module: "revenue-improvement-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildRevenueImprovementEngine(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
