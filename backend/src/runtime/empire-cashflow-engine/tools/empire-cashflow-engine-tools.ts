import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireCashflowEngine } from "../services/empire-cashflow-engine-service.js";

export const empireCashflowEngineTools: RegisteredTool[] = [{
  name: "empire_cashflow_engine.dashboard",
  description: "REAL-082 empire-cashflow-engine dashboard",
  module: "empire-cashflow-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireCashflowEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
