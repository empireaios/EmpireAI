import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalOpportunityBoard } from "../services/global-opportunity-board-service.js";

export const globalOpportunityBoardTools: RegisteredTool[] = [{
  name: "global_opportunity_board.dashboard",
  description: "REAL-084 global-opportunity-board dashboard",
  module: "global-opportunity-board",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalOpportunityBoard(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
