import type { RegisteredTool } from "../../../brain/types.js";
import { buildCountryDifferenceEngine } from "../services/country-difference-engine-service.js";

export const countryDifferenceEngineTools: RegisteredTool[] = [{
  name: "country_difference_engine.dashboard",
  description: "REAL-074 country-difference-engine dashboard",
  module: "country-difference-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCountryDifferenceEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
