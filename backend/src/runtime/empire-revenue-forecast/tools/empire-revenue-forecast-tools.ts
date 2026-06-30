import type { RegisteredTool } from "../../../brain/types.js";
import { buildEmpireRevenueForecast } from "../services/empire-revenue-forecast-service.js";

export const empireRevenueForecastTools: RegisteredTool[] = [{
  name: "empire_revenue_forecast.dashboard",
  description: "REAL-081 empire-revenue-forecast dashboard",
  module: "empire-revenue-forecast",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildEmpireRevenueForecast(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
