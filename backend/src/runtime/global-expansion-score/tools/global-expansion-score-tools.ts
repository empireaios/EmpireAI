import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalExpansionScore } from "../services/global-expansion-score-service.js";

export const globalExpansionScoreTools: RegisteredTool[] = [{
  name: "global_expansion_score.dashboard",
  description: "REAL-089 global-expansion-score dashboard",
  module: "global-expansion-score",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalExpansionScore(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
