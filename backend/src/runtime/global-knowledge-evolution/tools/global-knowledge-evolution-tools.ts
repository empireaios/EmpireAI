import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalKnowledgeEvolution } from "../services/global-knowledge-evolution-service.js";

export const globalKnowledgeEvolutionTools: RegisteredTool[] = [{
  name: "global_knowledge_evolution.dashboard",
  description: "REAL-042 Global knowledge evolution dashboard",
  module: "global-knowledge-evolution",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalKnowledgeEvolution(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
