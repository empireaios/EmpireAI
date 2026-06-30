import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalCategoryExpansionEngine } from "../services/global-category-expansion-engine-service.js";

export const globalCategoryExpansionEngineTools: RegisteredTool[] = [{
  name: "global_category_expansion_engine.dashboard",
  description: "REAL-029 Global category expansion engine dashboard",
  module: "global-category-expansion-engine",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalCategoryExpansionEngine(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
