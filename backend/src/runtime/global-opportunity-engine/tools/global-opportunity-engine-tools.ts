import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalOpportunityEngine } from "../services/global-opportunity-engine-service.js";

export const globalOpportunityEngineTools: RegisteredTool[] = [
  {
    name: "global_opportunity_engine.dashboard",
    description: "REAL-016 global expansion opportunity queue",
    module: "global-opportunity-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildGlobalOpportunityEngine(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
];
