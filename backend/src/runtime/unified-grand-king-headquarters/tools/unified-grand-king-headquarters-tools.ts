import type { RegisteredTool } from "../../../brain/types.js";
import { buildUnifiedGrandKingHeadquarters } from "../services/unified-grand-king-headquarters-service.js";

export const unifiedGrandKingHeadquartersTools: RegisteredTool[] = [{
  name: "unified_grand_king_headquarters.dashboard",
  description: "REAL-051 Unified Grand King Headquarters Mission Home dashboard",
  module: "unified-grand-king-headquarters",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildUnifiedGrandKingHeadquarters(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
