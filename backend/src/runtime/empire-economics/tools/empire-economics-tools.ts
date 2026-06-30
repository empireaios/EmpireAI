import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireEconomics } from "../services/empire-economics-service.js";

export const empireEconomicsTools: RegisteredTool[] = [{
  name: "empire_economics.dashboard",
  description: "REAL-019 Empire business economics dashboard",
  module: "empire-economics",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireEconomics(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
