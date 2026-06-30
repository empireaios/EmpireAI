import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireInvestmentEngine } from "../services/empire-investment-engine-service.js";

export const empireInvestmentEngineTools: RegisteredTool[] = [{
  name: "empire_investment_engine.dashboard",
  description: "REAL-083 empire-investment-engine dashboard",
  module: "empire-investment-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireInvestmentEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
