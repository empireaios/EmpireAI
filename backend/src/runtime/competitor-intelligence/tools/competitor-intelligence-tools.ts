import type { RegisteredTool } from "../../../brain/types.js";
import { buildCompetitorIntelligence } from "../services/competitor-intelligence-service.js";

export const competitorIntelligenceTools: RegisteredTool[] = [{
  name: "competitor_intelligence.dashboard",
  description: "REAL-027 Competitor intelligence dashboard",
  module: "competitor-intelligence",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildCompetitorIntelligence(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
