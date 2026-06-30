import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireKpiEngine } from "../services/empire-kpi-engine-service.js";

export const empireKpiEngineTools: RegisteredTool[] = [{
  name: "empire_kpi_engine.dashboard",
  description: "REAL-062 Empire KPI engine dashboard",
  module: "empire-kpi-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireKpiEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
