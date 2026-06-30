import type { RegisteredTool } from "../../../brain/types.js";
import { buildSoulDecisionChamber } from "../services/soul-decision-chamber-service.js";

export const soulDecisionChamberTools: RegisteredTool[] = [{
  name: "soul_decision_chamber.dashboard",
  description: "REAL-056 Soul decision chamber unified recommendation dashboard",
  module: "soul-decision-chamber",
  authorityLevel: "L1",
  parameters: {
    type: "object",
    properties: {
      workspaceId: { type: "string" },
      companyId: { type: "string" },
      topic: { type: "string" },
      summary: { type: "string" },
    },
  },
  handler: async (args) => buildSoulDecisionChamber(
    String(args.workspaceId ?? "ws_empire_1"),
    String(args.companyId ?? "co-grand-king"),
    {
      topic: String(args.topic ?? "Soul decision chamber"),
      subjectType: "general",
      summary: String(args.summary ?? "REAL-056 governed Soul recommendation"),
    },
  ),
}];
