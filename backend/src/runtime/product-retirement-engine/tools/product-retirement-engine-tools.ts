import type { RegisteredTool } from "../../../brain/types.js";
import { buildProductRetirementEngine } from "../services/product-retirement-engine-service.js";

export const productRetirementEngineTools: RegisteredTool[] = [{
  name: "product_retirement_engine.dashboard",
  description: "REAL-080 product-retirement-engine dashboard",
  module: "product-retirement-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildProductRetirementEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
