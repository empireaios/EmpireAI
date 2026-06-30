import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalRiskCommand } from "../services/global-risk-command-service.js";

export const globalRiskCommandTools: RegisteredTool[] = [{
  name: "global_risk_command.dashboard",
  description: "REAL-045 Global risk command dashboard",
  module: "global-risk-command",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalRiskCommand(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
