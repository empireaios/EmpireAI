import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalRevenueSimulation } from "../services/global-revenue-simulation-service.js";

export const globalRevenueSimulationTools: RegisteredTool[] = [{
  name: "global_revenue_simulation.dashboard",
  description: "REAL-030 Global revenue simulation dashboard",
  module: "global-revenue-simulation",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalRevenueSimulation(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
