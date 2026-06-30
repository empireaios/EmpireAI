import type { RegisteredTool } from "../../../brain/types.js";
import { buildGrandKingFinancialCommandCenter } from "../services/grand-king-financial-command-center-service.js";

export const grandKingFinancialCommandCenterTools: RegisteredTool[] = [{
  name: "grand_king_financial_command_center.dashboard",
  description: "REAL-020 Grand King Financial HQ",
  module: "grand-king-financial-command-center",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGrandKingFinancialCommandCenter(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
